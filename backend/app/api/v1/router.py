"""Agrupador das rotas da API v1."""

from fastapi import APIRouter

from app.features.auth.router import router as auth_router
from app.features.chat.router import router as agent_router
from app.features.customer360.router import router as customer360_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(agent_router)
api_router.include_router(customer360_router)
