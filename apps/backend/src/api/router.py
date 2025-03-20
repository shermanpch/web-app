from fastapi import APIRouter

from .endpoints import auth, divination, health

router = APIRouter()

# Include routers from endpoints
router.include_router(health.router, tags=["health"])
router.include_router(auth.router, prefix="/api", tags=["auth"])
router.include_router(divination.router, prefix="/api", tags=["divination"])
