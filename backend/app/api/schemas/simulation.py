from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class SimulationStartRequest(BaseModel):
    agent_count: int
    seed: int
    turns: Optional[int] = None


class SimulationStepRequest(BaseModel):
    steps: int = 1


class AgentState(BaseModel):
    agent_id: int
    strategy: str
    resources: int
    strength: int
    alive: bool
    trust: float
    aggression: float
    health: int
    kills: int


class Metrics(BaseModel):
    """Economic and governance metrics"""
    gini_resources: float = 0.0  # 0.0 = equal, 1.0 = one agent has all
    hhi_resources: float = 0.0   # Herfindahl-Hirschman Index for concentration
    avg_strength: float = 0.0
    avg_resources: float = 0.0
    governance_level: float = 0.0  # How much rules are being used


class SimulationState(BaseModel):
    simulation_id: str
    current_turn: int
    agents: List[AgentState]
    rules: int  # rules version
    alive_count: int
    event_count: int
    metrics: Optional[Metrics] = None


class SimulationEvent(BaseModel):
    turn: int
    actor: int
    action: str
    target: Optional[int]
    outcome: str
    rule_justification: str
    details: Dict[str, Any]
    narrative: Optional[str] = None  # Human-readable description


class SimulationEvents(BaseModel):
    simulation_id: str
    events: List[SimulationEvent]
    total_events: int


class SimulationNarratives(BaseModel):
    simulation_id: str
    narratives: List[str]
    total_narratives: int
    since_turn: int = 0


class BlockchainTransferSummary(BaseModel):
    executed: int = 0
    failed: int = 0
    total_transfers: int = 0


class SimulationSummary(BaseModel):
    simulation_id: str
    seed: int
    turns_completed: int
    leaderboard: List[AgentState]
    action_counts: Dict[str, int]
    log_digest: str
    rules_version: int
    blockchain_transfers: Optional[BlockchainTransferSummary] = None