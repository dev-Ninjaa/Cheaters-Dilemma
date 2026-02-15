from datetime import datetime, timezone
from typing import Any, Dict
import asyncio

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect

from ...services.simulation_service import SimulationService
# Removed to break circular import
# from ...services.event_narrator import EventNarrator
from ...services.replay_service import ReplayService
from ..schemas.simulation import (
    SimulationStartRequest,
    SimulationStepRequest,
    SimulationState,
    SimulationEvents,
    SimulationNarratives,
    SimulationSummary
)

router = APIRouter()


class SimulationManager:
    """Simple in-memory simulation manager"""
    def __init__(self):
        self.simulations: Dict[str, Dict[str, Any]] = {}
        self.replay_service = ReplayService()

    def create_simulation(self, config: Dict[str, Any]) -> str:
        import uuid
        sim_id = str(uuid.uuid4())
        service = SimulationService()
        world = service.create_world(
            agent_count=config["agent_count"],
            seed=config["seed"],
            turns=config.get("turns")
        )
        initial_result = world.snapshot()
        self.simulations[sim_id] = {
            "world": world,
            "result": initial_result,
            "current_turn": 0,
            "is_running": False
        }
        return sim_id

    def get_simulation(self, sim_id: str) -> Dict[str, Any]:
        if sim_id not in self.simulations:
            raise HTTPException(status_code=404, detail="Simulation not found")
        return self.simulations[sim_id]

    def step_simulation(self, sim_id: str, steps: int = 1) -> Dict[str, Any]:
        sim = self.get_simulation(sim_id)
        if sim["is_running"]:
            raise HTTPException(status_code=400, detail="Simulation is already running")

        world = sim["world"]
        simulation_completed = False
        
        for _ in range(steps):
            if not world.step():
                simulation_completed = True
                break  # Simulation is complete

        # Update the result with current snapshot
        snapshot = world.snapshot()
        # Add metrics to the snapshot
        service = SimulationService()
        snapshot["metrics"] = service._calculate_metrics(snapshot)
        sim["result"] = snapshot
        
        # Save replay if simulation completed
        if simulation_completed:
            try:
                self.replay_service.save_replay(sim_id, snapshot)
                print(f"Saved replay for completed simulation {sim_id}")
            except Exception as e:
                # Log error but don't fail the request
                print(f"Failed to save replay for {sim_id}: {e}")
        else:
            print(f"Simulation {sim_id} not completed yet (alive: {len(snapshot.get('alive', []))}, turns: {snapshot.get('turns_completed', 0)})")
        
        return snapshot


simulation_manager = SimulationManager()


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


@router.post("/start", response_model=Dict[str, str])
async def start_simulation(request: SimulationStartRequest) -> Dict[str, str]:
    """Start a new simulation"""
    try:
        sim_id = simulation_manager.create_simulation({
            "agent_count": request.agent_count,
            "seed": request.seed,
            "turns": request.turns
        })
        return {"simulation_id": sim_id}
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        raise HTTPException(status_code=500, detail=f"Failed to start simulation: {str(e)}\n{error_details}")


@router.post("/{simulation_id}/save-replay", response_model=Dict[str, str])
async def save_simulation_replay(simulation_id: str) -> Dict[str, str]:
    """Save a replay of the current simulation state"""
    try:
        sim = simulation_manager.get_simulation(simulation_id)
        snapshot = sim["result"]
        
        replay_id = simulation_manager.replay_service.save_replay(simulation_id, snapshot)
        return {"replay_id": replay_id, "message": "Replay saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save replay: {str(e)}")


@router.post("/{simulation_id}/step", response_model=SimulationState)
async def step_simulation(
    simulation_id: str,
    request: SimulationStepRequest
) -> SimulationState:
    """Advance simulation by specified steps"""
    try:
        result = simulation_manager.step_simulation(simulation_id, request.steps)
        return SimulationState(
            simulation_id=simulation_id,
            current_turn=result.get("turns_completed", 0),
            agents=result.get("leaderboard", []),
            rules=result.get("rules_version", 1),
            alive_count=len(result.get("alive", [])),
            event_count=result.get("event_count", 0)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to step simulation: {str(e)}")


@router.get("/{simulation_id}/state", response_model=SimulationState)
async def get_simulation_state(simulation_id: str) -> SimulationState:
    """Get current simulation state"""
    try:
        sim = simulation_manager.get_simulation(simulation_id)
        result = sim["result"]
        return SimulationState(
            simulation_id=simulation_id,
            current_turn=result.get("turns_completed", 0),
            agents=result.get("leaderboard", []),
            rules=result.get("rules_version", 1),
            alive_count=len(result.get("alive", [])),
            event_count=result.get("event_count", 0),
            metrics=result.get("metrics")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get simulation state: {str(e)}")


@router.get("/{simulation_id}/events", response_model=SimulationEvents)
async def get_simulation_events(
    simulation_id: str,
    since_turn: int = 0
) -> SimulationEvents:
    """Get simulation events since specified turn"""
    try:
        sim = simulation_manager.get_simulation(simulation_id)
        result = sim["result"]
        events = result.get("events", [])

        # Filter events since the specified turn
        filtered_events = [e for e in events if e.get("turn", 0) >= since_turn]

        # Add human-readable narratives to events
        from ...services.event_narrator import EventNarrator
        for event in filtered_events:
            event["narrative"] = EventNarrator.narrate_event(event)

        return SimulationEvents(
            simulation_id=simulation_id,
            events=filtered_events,
            total_events=len(filtered_events)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get simulation events: {str(e)}")


@router.get("/{simulation_id}/narratives", response_model=SimulationNarratives)
async def get_simulation_narratives(
    simulation_id: str,
    since_turn: int = 0
) -> SimulationNarratives:
    """Get human-readable narratives for simulation events since specified turn"""
    try:
        sim = simulation_manager.get_simulation(simulation_id)
        result = sim["result"]
        events = result.get("events", [])

        # Filter events since the specified turn
        filtered_events = [e for e in events if e.get("turn", 0) >= since_turn]

        # Generate narratives
        from ...services.event_narrator import EventNarrator
        narratives = EventNarrator.narrate_events(filtered_events)

        return SimulationNarratives(
            simulation_id=simulation_id,
            narratives=narratives,
            total_narratives=len(narratives),
            since_turn=since_turn
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get simulation narratives: {str(e)}")


@router.get("/{simulation_id}/summary", response_model=SimulationSummary)
async def get_simulation_summary(simulation_id: str) -> SimulationSummary:
    """Get simulation summary and final results"""
    try:
        sim = simulation_manager.get_simulation(simulation_id)
        result = sim["result"]
        return SimulationSummary(
            simulation_id=simulation_id,
            seed=result.get("seed"),
            turns_completed=result.get("turns_completed", 0),
            leaderboard=result.get("leaderboard", []),
            action_counts=result.get("action_counts", {}),
            log_digest=result.get("log_digest", ""),
            rules_version=result.get("rules_version", 1)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get simulation summary: {str(e)}")


@router.websocket("/ws/health")
async def simulation_health_socket(websocket: WebSocket) -> None:
    """Lightweight backend heartbeat channel for frontend connectivity checks."""
    await websocket.accept()
    tick = 0
    try:
        await websocket.send_json(
            {
                "type": "connected",
                "service": "simulation",
                "timestamp": _utc_now_iso(),
            }
        )
        while True:
            tick += 1
            await websocket.send_json(
                {
                    "type": "heartbeat",
                    "tick": tick,
                    "timestamp": _utc_now_iso(),
                }
            )
            await asyncio.sleep(2.0)
    except WebSocketDisconnect:
        return


@router.websocket("/ws/stream/{simulation_id}")
async def simulation_stream_socket(
    websocket: WebSocket,
    simulation_id: str,
    interval_ms: int = 250,
    from_turn: int = 1,
) -> None:
    """Stream simulation events turn-by-turn over WebSocket."""
    print(f"WebSocket connection for simulation {simulation_id}, from_turn={from_turn}")
    await websocket.accept()
    try:
        sim = simulation_manager.get_simulation(simulation_id)
        print(f"Found simulation, world turns_completed: {sim['world'].turns_completed}")
    except HTTPException:
        print(f"Simulation {simulation_id} not found")
        await websocket.send_json(
            {
                "type": "error",
                "message": "Simulation not found",
                "simulation_id": simulation_id,
            }
        )
        await websocket.close(code=4404)
        return

    world = sim["world"]
    delay_seconds = max(50, min(interval_ms, 5000)) / 1000.0
    start_turn = max(1, from_turn)

    print(f"Starting simulation stream: delay={delay_seconds}s, start_turn={start_turn}")

    try:
        await websocket.send_json(
            {
                "type": "init",
                "simulation_id": simulation_id,
                "turns_completed": world.turns_completed,
                "event_count": len(world.logger.events),
                "from_turn": start_turn,
                "timestamp": _utc_now_iso(),
            }
        )

        # Run simulation from current turn onwards
        current_turn = max(world.turns_completed, start_turn - 1)
        print(f"Starting simulation loop from turn {current_turn + 1}")

        turn_count = 0
        while world.step():
            current_turn += 1
            turn_count += 1

            # Get events for this turn
            turn_events = [e for e in world.logger.events if e.get("turn") == current_turn]
            print(f"Turn {current_turn}: {len(turn_events)} events, {len(world.alive)} agents alive")

            # Update stored result
            sim["result"] = world.snapshot()

            await websocket.send_json(
                {
                    "type": "turn",
                    "simulation_id": simulation_id,
                    "turn": current_turn,
                    "events": turn_events,
                    "timestamp": _utc_now_iso(),
                }
            )
            await asyncio.sleep(delay_seconds)

            # Safety check - don't run forever
            if turn_count > 1000:
                print("Safety: stopping after 1000 turns")
                break

        print(f"Simulation completed after {turn_count} turns")

        # Update final result
        sim["result"] = world.snapshot()

        await websocket.send_json(
            {
                "type": "complete",
                "simulation_id": simulation_id,
                "turns_completed": world.turns_completed,
                "event_count": len(world.logger.events),
                "timestamp": _utc_now_iso(),
            }
        )

        # Keep the socket alive for optional ping/pong after stream completion.
        while True:
            message = await websocket.receive_text()
            if message.strip().lower() == "ping":
                await websocket.send_json(
                    {
                        "type": "pong",
                        "simulation_id": simulation_id,
                        "timestamp": _utc_now_iso(),
                    }
                )
    except WebSocketDisconnect:
        return
