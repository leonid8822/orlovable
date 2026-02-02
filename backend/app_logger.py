"""
Application Logger - writes logs to Supabase for remote debugging.

Usage:
    from app_logger import logger

    await logger.info("gem_upload", "Starting gem upload", {"gem_name": "Рубин"})
    await logger.error("gem_upload", "Upload failed", {"error": str(e), "traceback": traceback.format_exc()})
"""

import traceback
from datetime import datetime
from typing import Optional, Any
import json


class AppLogger:
    """Logger that writes to Supabase app_logs table."""

    def __init__(self):
        self._supabase = None

    @property
    def supabase(self):
        if self._supabase is None:
            from supabase_client import supabase
            self._supabase = supabase
        return self._supabase

    async def _log(self, level: str, source: str, message: str, details: Optional[dict] = None):
        """Write log entry to database."""
        try:
            log_entry = {
                "level": level,
                "source": source,
                "message": message,
                "details": details,
            }
            await self.supabase.insert("app_logs", log_entry)
        except Exception as e:
            # Fallback to console if DB logging fails
            print(f"[{level.upper()}] [{source}] {message}")
            if details:
                print(f"  Details: {json.dumps(details, ensure_ascii=False, default=str)[:500]}")
            print(f"  (DB logging failed: {e})")

    async def debug(self, source: str, message: str, details: Optional[dict] = None):
        """Log debug message."""
        await self._log("debug", source, message, details)

    async def info(self, source: str, message: str, details: Optional[dict] = None):
        """Log info message."""
        await self._log("info", source, message, details)

    async def warning(self, source: str, message: str, details: Optional[dict] = None):
        """Log warning message."""
        await self._log("warning", source, message, details)

    async def error(self, source: str, message: str, details: Optional[dict] = None):
        """Log error message."""
        await self._log("error", source, message, details)

    async def exception(self, source: str, message: str, exc: Exception, extra: Optional[dict] = None):
        """Log exception with full traceback."""
        details = {
            "error_type": type(exc).__name__,
            "error_message": str(exc),
            "traceback": traceback.format_exc(),
        }
        if extra:
            details.update(extra)
        await self._log("error", source, message, details)


# Singleton instance
logger = AppLogger()
