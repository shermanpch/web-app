"""API router configuration for the application."""

from fastapi import APIRouter

from .endpoints import auth, divination, health, user


router = APIRouter()

# Include routers from endpoints
router.include_router(health.router, tags=["health"])
router.include_router(auth.router, prefix="/api", tags=["auth"])
router.include_router(divination.router, prefix="/api", tags=["divination"])
router.include_router(user.router, prefix="/api", tags=["user"])
