"""
Domain models for The Cheater's Dilemma simulation.
Contains core business entities and value objects.
"""

from __future__ import annotations
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum


class AgentStrategy(Enum):
    """Available agent strategies."""
    CHEATER = "cheater"
    GREEDY = "greedy"
    POLITICIAN = "politician"
    WARLORD = "warlord"
    HEURISTICS = "heuristics"
    PROBABILISTIC = "probabilistic"


@dataclass
class Agent:
    """Core agent entity."""
    agent_id: int
    strategy: AgentStrategy
    token_balance: int
    strength: int
    alive: bool = True
    trust: float = 0.5
    aggression: float = 0.5
    rank: int = 0
    total_actions: int = 0
    successful_actions: int = 0
    failed_actions: int = 0
    reputation_history: List[float] = None
    token_balance_history: List[int] = None
    # New attributes
    health: int = 50  # Default health
    max_health: int = 50
    kills: int = 0  # Number of agents killed
    position: tuple = (0, 0)  # (x, y) coordinates
    alliances: List[int] = None  # List of allied agent IDs

    def __post_init__(self):
        if self.reputation_history is None:
            self.reputation_history = []
        if self.token_balance_history is None:
            self.token_balance_history = []
        if self.alliances is None:
            self.alliances = []


@dataclass
class WorldState:
    """Current state of the simulation world."""
    simulation_id: str
    current_turn: int
    agents: List[Agent]
    rules: Dict[str, Any]
    alive_count: int = 0
    event_count: int = 0

    def __post_init__(self):
        self.alive_count = sum(1 for agent in self.agents if agent.alive)


@dataclass
class Rule:
    """A governance rule in the simulation."""
    rule_id: str
    name: str
    description: str
    enabled: bool = True
    parameters: Dict[str, Any] = None

    def __post_init__(self):
        if self.parameters is None:
            self.parameters = {}


@dataclass
class Alliance:
    """Relationship between agents."""
    agent1_id: int
    agent2_id: int
    trust_level: float
    strength: int
    formed_turn: int
    active: bool = True
    broken_turn: Optional[int] = None
    
    def get_combined_strength(self) -> int:
        """Get combined strength of alliance."""
        return self.strength
    
    def involves_agent(self, agent_id: int) -> bool:
        """Check if agent is part of this alliance."""
        return agent_id in (self.agent1_id, self.agent2_id)
    
    def get_partner(self, agent_id: int) -> Optional[int]:
        """Get the partner agent ID."""
        if agent_id == self.agent1_id:
            return self.agent2_id
        elif agent_id == self.agent2_id:
            return self.agent1_id
        return None