"""Backend package for the Divination application."""

# API
from .api.endpoints import auth, divination, health, user
from .api.router import router as api_router

# Config
from .config import settings

# Core
from .core.oracle import Oracle

# Models
from .models.auth import UserData, UserLogin, UserSignup
from .models.divination import (
    IChingImageRequest,
    IChingImageResponse,
    IChingTextRequest,
    IChingTextResponse,
)
from .models.users import UserQuotaRequest, UserQuotaResponse

# Services
from .services.auth import get_current_user
from .services.auth.supabase import get_authenticated_client, get_supabase_client
from .services.divination.iching import (
    get_iching_image_from_bucket,
    get_iching_text_from_db,
)
from .services.users.quota import get_user_quota_from_db

# Utils
from .utils.clients import IChingAPIClient

__all__ = [
    # API
    "api_router",
    "auth",
    "divination",
    "health",
    "user",
    # Config
    "settings",
    # Core
    "Oracle",
    # Models
    "UserData",
    "UserLogin",
    "UserSignup",
    "IChingImageRequest",
    "IChingImageResponse",
    "IChingTextRequest",
    "IChingTextResponse",
    "UserQuotaRequest",
    "UserQuotaResponse",
    # Services
    "get_current_user",
    "get_authenticated_client",
    "get_supabase_client",
    "get_iching_image_from_bucket",
    "get_iching_text_from_db",
    "get_user_quota_from_db",
    # Utils
    "IChingAPIClient",
]
