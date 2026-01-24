import os
import httpx
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://vofigcbihwkmocrsfowt.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

class SupabaseClient:
    def __init__(self):
        self.url = SUPABASE_URL
        self.key = SUPABASE_KEY
        if not self.key:
            print("WARNING: SUPABASE_SERVICE_KEY is not set!")
        self.headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}" if self.key else "",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        # Remove empty Authorization header
        if not self.key:
            del self.headers["Authorization"]
            del self.headers["apikey"]

    def _rest_url(self, table: str) -> str:
        return f"{self.url}/rest/v1/{table}"

    async def select(self, table: str, columns: str = "*", filters: dict = None, order: str = None, limit: int = None):
        """Select records from table"""
        url = f"{self._rest_url(table)}?select={columns}"

        if filters:
            for key, value in filters.items():
                url += f"&{key}=eq.{value}"

        if order:
            url += f"&order={order}"

        if limit:
            url += f"&limit={limit}"

        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()

    async def select_by_field(self, table: str, field: str, value: str, columns: str = "*"):
        """Select record by arbitrary field"""
        url = f"{self._rest_url(table)}?{field}=eq.{value}&select={columns}"

        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            return data[0] if data else None

    async def select_one(self, table: str, id: str, columns: str = "*"):
        """Select single record by id"""
        url = f"{self._rest_url(table)}?id=eq.{id}&select={columns}"

        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            return data[0] if data else None

    async def insert(self, table: str, data: dict):
        """Insert record into table"""
        url = self._rest_url(table)

        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=self.headers, json=data)
            response.raise_for_status()
            result = response.json()
            return result[0] if result else None

    async def update(self, table: str, id: str, data: dict):
        """Update record by id"""
        url = f"{self._rest_url(table)}?id=eq.{id}"

        async with httpx.AsyncClient() as client:
            response = await client.patch(url, headers=self.headers, json=data)
            response.raise_for_status()
            result = response.json()
            return result[0] if result else None

    async def delete(self, table: str, id: str):
        """Delete record by id"""
        url = f"{self._rest_url(table)}?id=eq.{id}"

        async with httpx.AsyncClient() as client:
            response = await client.delete(url, headers=self.headers)
            response.raise_for_status()
            return True

# Singleton instance
supabase = SupabaseClient()
