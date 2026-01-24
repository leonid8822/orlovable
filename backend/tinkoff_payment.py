"""
Tinkoff Acquiring API Integration
Documentation: https://www.tinkoff.ru/kassa/develop/api/payments/
"""

import hashlib
import httpx
from typing import Optional
import os

# Tinkoff API URLs
TINKOFF_API_URL = "https://securepay.tinkoff.ru/v2"


def get_terminal_key() -> str:
    """Get terminal key from environment"""
    return os.environ.get("TINKOFF_TERMINAL_KEY", "")


def get_terminal_password() -> str:
    """Get terminal password from environment"""
    return os.environ.get("TINKOFF_PASSWORD", "")


def generate_token(params: dict) -> str:
    """
    Generate token for Tinkoff API request.
    Token = SHA256 of concatenated sorted params + Password
    """
    password = get_terminal_password()

    # Add password to params for token generation
    token_params = {**params, "Password": password}

    # Remove Token if exists (shouldn't be included in generation)
    token_params.pop("Token", None)

    # Sort by keys and concatenate values
    sorted_keys = sorted(token_params.keys())
    values_concat = "".join(str(token_params[key]) for key in sorted_keys if token_params[key] is not None)

    # Generate SHA256
    token = hashlib.sha256(values_concat.encode()).hexdigest()

    return token


async def init_payment(
    order_id: str,
    amount_kopeks: int,
    description: str,
    customer_email: Optional[str] = None,
    customer_name: Optional[str] = None,
    success_url: Optional[str] = None,
    fail_url: Optional[str] = None,
) -> dict:
    """
    Initialize payment in Tinkoff

    Args:
        order_id: Unique order ID (max 36 chars)
        amount_kopeks: Amount in kopeks (1 rub = 100 kopeks)
        description: Payment description (max 250 chars)
        customer_email: Customer email for receipt
        customer_name: Customer name
        success_url: URL to redirect after successful payment
        fail_url: URL to redirect after failed payment

    Returns:
        dict with PaymentId, PaymentURL, Status
    """
    terminal_key = get_terminal_key()

    if not terminal_key:
        raise ValueError("TINKOFF_TERMINAL_KEY not configured")

    params = {
        "TerminalKey": terminal_key,
        "Amount": amount_kopeks,
        "OrderId": order_id,
        "Description": description[:250],  # Max 250 chars
    }

    if success_url:
        params["SuccessURL"] = success_url
    if fail_url:
        params["FailURL"] = fail_url

    # Add receipt data if email provided (required for online stores in Russia)
    if customer_email:
        params["Receipt"] = {
            "Email": customer_email,
            "Taxation": "usn_income",  # УСН доходы
            "Items": [
                {
                    "Name": description[:64],  # Max 64 chars
                    "Price": amount_kopeks,
                    "Quantity": 1,
                    "Amount": amount_kopeks,
                    "Tax": "none",  # Без НДС (ИП на УСН)
                    "PaymentMethod": "prepayment",  # Предоплата
                    "PaymentObject": "commodity",  # Товар
                }
            ]
        }

    # Generate token
    # Note: For Init with Receipt, token generation uses only flat params
    token_params = {
        "TerminalKey": terminal_key,
        "Amount": amount_kopeks,
        "OrderId": order_id,
        "Description": description[:250],
    }
    if success_url:
        token_params["SuccessURL"] = success_url
    if fail_url:
        token_params["FailURL"] = fail_url

    params["Token"] = generate_token(token_params)

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            f"{TINKOFF_API_URL}/Init",
            json=params
        )
        response.raise_for_status()
        result = response.json()

    if not result.get("Success"):
        error_msg = result.get("Message", "Unknown error")
        error_code = result.get("ErrorCode", "")
        raise Exception(f"Tinkoff Init failed: {error_code} - {error_msg}")

    return {
        "payment_id": result.get("PaymentId"),
        "payment_url": result.get("PaymentURL"),
        "status": result.get("Status"),
        "order_id": order_id,
        "amount": amount_kopeks,
    }


async def get_payment_state(payment_id: str) -> dict:
    """
    Get current payment state

    Args:
        payment_id: Payment ID from Init response

    Returns:
        dict with Status, PaymentId, etc.
    """
    terminal_key = get_terminal_key()

    params = {
        "TerminalKey": terminal_key,
        "PaymentId": payment_id,
    }

    params["Token"] = generate_token(params)

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            f"{TINKOFF_API_URL}/GetState",
            json=params
        )
        response.raise_for_status()
        result = response.json()

    return {
        "success": result.get("Success"),
        "status": result.get("Status"),
        "payment_id": result.get("PaymentId"),
        "order_id": result.get("OrderId"),
        "amount": result.get("Amount"),
        "error_code": result.get("ErrorCode"),
        "message": result.get("Message"),
    }


def verify_notification_token(params: dict) -> bool:
    """
    Verify token from Tinkoff notification callback

    Args:
        params: Notification params including Token

    Returns:
        True if token is valid
    """
    received_token = params.get("Token", "")

    # Generate expected token
    verify_params = {k: v for k, v in params.items() if k != "Token" and v is not None}
    expected_token = generate_token(verify_params)

    return received_token.lower() == expected_token.lower()


# Payment statuses from Tinkoff
PAYMENT_STATUS_NEW = "NEW"
PAYMENT_STATUS_FORM_SHOWED = "FORM_SHOWED"
PAYMENT_STATUS_AUTHORIZING = "AUTHORIZING"
PAYMENT_STATUS_3DS_CHECKING = "3DS_CHECKING"
PAYMENT_STATUS_3DS_CHECKED = "3DS_CHECKED"
PAYMENT_STATUS_AUTHORIZED = "AUTHORIZED"
PAYMENT_STATUS_CONFIRMING = "CONFIRMING"
PAYMENT_STATUS_CONFIRMED = "CONFIRMED"  # Payment successful
PAYMENT_STATUS_REVERSING = "REVERSING"
PAYMENT_STATUS_REVERSED = "REVERSED"  # Payment reversed
PAYMENT_STATUS_REFUNDING = "REFUNDING"
PAYMENT_STATUS_PARTIAL_REFUNDED = "PARTIAL_REFUNDED"
PAYMENT_STATUS_REFUNDED = "REFUNDED"  # Payment refunded
PAYMENT_STATUS_CANCELED = "CANCELED"  # Payment canceled
PAYMENT_STATUS_REJECTED = "REJECTED"  # Payment rejected
PAYMENT_STATUS_DEADLINE_EXPIRED = "DEADLINE_EXPIRED"  # Timeout

# Success statuses
SUCCESS_STATUSES = {PAYMENT_STATUS_CONFIRMED, PAYMENT_STATUS_AUTHORIZED}

# Final statuses (payment process completed)
FINAL_STATUSES = {
    PAYMENT_STATUS_CONFIRMED,
    PAYMENT_STATUS_REVERSED,
    PAYMENT_STATUS_REFUNDED,
    PAYMENT_STATUS_PARTIAL_REFUNDED,
    PAYMENT_STATUS_CANCELED,
    PAYMENT_STATUS_REJECTED,
    PAYMENT_STATUS_DEADLINE_EXPIRED,
}
