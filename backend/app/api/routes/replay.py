from typing import List
from fastapi import APIRouter, HTTPException

from ..schemas.replay import ReplaySummary, ReplayDetail
# Removed import to break circular import
# from ..services.replay_service import ReplayService

router = APIRouter()
# Removed instantiation to make it lazy
# replay_service = ReplayService()


@router.get("/", response_model=List[ReplaySummary])
async def get_replays() -> List[ReplaySummary]:
    """Get list of completed simulations"""
    try:
        from app.services.replay_service import ReplayService
        replay_service = ReplayService()
        replays = replay_service.list_replays()
        return [ReplaySummary(**replay) for replay in replays]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get replays: {str(e)}")


@router.get("/{replay_id}", response_model=ReplayDetail)
async def get_replay_detail(replay_id: str) -> ReplayDetail:
    """Get detailed replay data for playback"""
    try:
        from app.services.replay_service import ReplayService
        replay_service = ReplayService()
        replay_data = replay_service.load_replay(replay_id)
        if not replay_data:
            raise HTTPException(status_code=404, detail="Replay not found")
        
        # Convert the replay data to ReplayDetail format
        return ReplayDetail(
            replay_id=replay_data["replay_id"],
            seed=replay_data["seed"],
            agent_count=replay_data["agent_count"],
            turns_completed=replay_data["turns_completed"],
            leaderboard=replay_data["data"].get("leaderboard", []),
            events=replay_data["data"].get("events", []),
            log_digest=replay_data["data"].get("log_digest", "")
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get replay detail: {str(e)}")