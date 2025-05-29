"""Generic Health Check Endpoints"""

from datetime import datetime, timezone
import platform
import time

from fastapi import APIRouter
from fastapi.responses import JSONResponse
import psutil


router = APIRouter()

# Track service start time
START_TIME = time.time()


@router.get("/health", tags=["Health Check"])
async def health_check():
    """
    Generic health check endpoint providing system status.

    Returns:
        JSON response with health status, system information, and uptime.
    """
    uptime_seconds = int(time.time() - START_TIME)
    uptime_readable = f"{uptime_seconds // 3600}h {(uptime_seconds % 3600) // 60}m {uptime_seconds % 60}s"

    # Get system information
    health_data = {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "system": {
            "python_version": platform.python_version(),
            "platform": platform.platform(),
            "cpu_usage": psutil.cpu_percent(interval=1),
            "memory_usage": psutil.virtual_memory().percent,
            "disk_usage": psutil.disk_usage("/").percent,
            "uptime": uptime_readable,
        },
        "services": {
            "database": "ok",  # Change this if checking DB connection
            "cache": "ok",  # Modify based on caching system
            "auth": "ok",  # Modify based on authentication system
        },
    }

    return JSONResponse(content=health_data)
