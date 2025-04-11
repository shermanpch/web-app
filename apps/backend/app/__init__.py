"""Backend package for the Divination application."""

# API
from .api.endpoints import auth, divination, health, user
from .api.router import router as api_router

# Config
from .config import settings

# Models
from .models.auth import UserData, UserLogin, UserSignup
from .models.divination import (
    IChingCoordinatesRequest,
    IChingCoordinatesResponse,
    IChingReadingRequest,
    IChingReadingResponse,
    IChingSaveReadingRequest,
    IChingSaveReadingResponse,
    IChingTextRequest,
    IChingTextResponse,
    IChingUpdateReadingRequest,
    IChingUpdateReadingResponse,
)
from .models.users import (
    UserProfileResponse,
    UserProfileStatusResponse,
    UserQuotaStatusResponse,
    UserReadingResponse,
)

# Services
from .services.auth import get_current_user
from .services.auth.supabase import (
    get_authenticated_client,
    get_supabase_admin_client,
    get_supabase_client,
)
from .services.core.oracle import Oracle
from .services.divination.iching import (
    get_iching_coordinates_from_oracle,
    get_iching_reading_from_oracle,
    get_iching_text_from_db,
    save_iching_reading_to_db,
    update_iching_reading_in_db,
)
from .services.users.quota import check_quota, log_usage
from .services.users.reading import get_user_readings_from_db

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
    "IChingCoordinatesRequest",
    "IChingCoordinatesResponse",
    "IChingReadingRequest",
    "IChingReadingResponse",
    "IChingSaveReadingRequest",
    "IChingSaveReadingResponse",
    "IChingUpdateReadingRequest",
    "IChingUpdateReadingResponse",
    "IChingTextRequest",
    "IChingTextResponse",
    "UserProfileResponse",
    "UserProfileStatusResponse",
    "UserQuotaStatusResponse",
    "UserReadingResponse",
    # Services
    "get_current_user",
    "get_authenticated_client",
    "get_supabase_client",
    "get_supabase_admin_client",
    "get_iching_coordinates_from_oracle",
    "get_iching_reading_from_oracle",
    "get_iching_text_from_db",
    "save_iching_reading_to_db",
    "update_iching_reading_in_db",
    "check_quota",
    "log_usage",
    "get_user_readings_from_db",
]
