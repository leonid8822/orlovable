import os
import httpx
from typing import Optional

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")

async def send_verification_email(to_email: str, name: str, code: str) -> bool:
    """Send verification code email using Resend API"""

    if not RESEND_API_KEY:
        print(f"WARNING: RESEND_API_KEY not set. Would send code {code} to {to_email}")
        return True  # Return True for development without email

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "from": "OLAI.art <noreply@olai.art>",
                    "to": [to_email],
                    "subject": f"Код подтверждения: {code}",
                    "html": f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #fafafa; padding: 40px 20px; margin: 0;">
    <div style="max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); border-radius: 16px; padding: 40px; border: 1px solid #333;">
        <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 28px; font-weight: 600; margin: 0; background: linear-gradient(135deg, #c9a050 0%, #e8d5a3 50%, #c9a050 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">OLAI.art</h1>
            <p style="color: #888; font-size: 14px; margin-top: 8px;">Ювелирные украшения по вашему дизайну</p>
        </div>

        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            Здравствуйте, {name}!
        </p>

        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            Ваш код подтверждения:
        </p>

        <div style="background: linear-gradient(135deg, #c9a050 0%, #e8d5a3 50%, #c9a050 100%); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #0a0a0a;">{code}</span>
        </div>

        <p style="font-size: 14px; color: #888; line-height: 1.6; margin-bottom: 24px;">
            Код действителен 10 минут. Если вы не запрашивали код, просто проигнорируйте это письмо.
        </p>

        <hr style="border: none; border-top: 1px solid #333; margin: 32px 0;">

        <p style="font-size: 12px; color: #666; text-align: center; margin: 0;">
            © 2025-2026 OLAI.art. Все права защищены.
        </p>
    </div>
</body>
</html>
"""
                }
            )

            if response.status_code == 200:
                print(f"Verification email sent to {to_email}")
                return True
            else:
                print(f"Failed to send email: {response.status_code} - {response.text}")
                return False

    except Exception as e:
        print(f"Error sending email: {e}")
        return False
