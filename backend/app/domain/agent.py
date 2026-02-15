from __future__ import annotations

from dataclasses import dataclass
from random import Random
from typing import Any

from .actions import Action


@dataclass(frozen=True)
class AgentObservation:
    turn: int
    self_id: int
    self_token_balance: int
    self_strength: int
    self_rank: int
    self_health: int
    alive_ids: tuple[int, ...]
    token_balance_by_agent: dict[int, int]
    strength_by_agent: dict[int, int]
    health_by_agent: dict[int, int]
    trust_by_agent: dict[int, float]
    aggression_by_agent: dict[int, float]
    current_rules: dict[str, Any]
    pending_proposal: dict[str, Any] | None
    last_harm_from: int | None


class Agent:
    name: str = "base"

    def decide(self, obs: AgentObservation, rng: Random) -> Action:
        raise NotImplementedError
