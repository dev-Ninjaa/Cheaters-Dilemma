from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import simulation, agents, rules, replay, wallets
from .core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown


app = FastAPI(
    title="The Cheater's Dilemma API",
    description="Multi-agent game-theoretic simulation with mutable governance",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(simulation.router, prefix="/api/v1/simulation", tags=["simulation"])
app.include_router(agents.router, prefix="/api/v1/agents", tags=["agents"])
app.include_router(rules.router, prefix="/api/v1/rules", tags=["rules"])
app.include_router(replay.router, prefix="/api/v1/replays", tags=["replays"])
app.include_router(wallets.router, prefix="/api/v1/wallets", tags=["wallets"])


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "cheaters-dilemma-backend"}


if __name__ == "__main__":
    import uvicorn
    import sys
    import os
    # Add the parent directory to Python path for relative imports
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
