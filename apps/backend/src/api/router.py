from fastapi import APIRouter
from src.api.endpoints import health, todos

router = APIRouter()

# Include routers from endpoints
router.include_router(health.router, tags=["health"])
router.include_router(todos.router, prefix="/todos", tags=["todos"])
