"""Health check endpoints."""

import platform
from datetime import datetime, timezone

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from ...auth.supabase import get_supabase_client
from ...config import settings

router = APIRouter()


@router.get("/health")
async def health_check():
    """
    Health check endpoint providing system status and configuration information.

    Returns:
        JSON response with health status and system information
    """
    # Check database connection by testing Supabase
    db_status = "ok"
    try:
        # Simple test query to check connection
        client = get_supabase_client()
        client.table("user_quotas").select("count", count="exact").limit(1).execute()
    except Exception as e:
        db_status = f"error: {str(e)}"

    # Get system information
    health_data = {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "environment": "development" if settings.DEBUG else "production",
        "api_version": "1.0.0",
        "system": {
            "python_version": platform.python_version(),
            "platform": platform.platform(),
        },
        "services": {
            "database": db_status,
            "auth": (
                "ok"
                if settings.SUPABASE_URL and settings.SUPABASE_KEY
                else "not configured"
            ),
        },
    }

    return JSONResponse(content=health_data)
