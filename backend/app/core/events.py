"""
Domain events and logging system for The Cheater's Dilemma.
Handles event publishing, logging, and event sourcing.
"""

from __future__ import annotations
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass
from datetime import datetime
import json
import logging

# Removed import to break circular import
# from ..services.event_narrator import EventNarrator


@dataclass
class DomainEvent:
    """Base class for domain events."""
    event_type: str
    timestamp: datetime
    event_id: str
    data: Dict[str, Any]

    def __post_init__(self):
        if isinstance(self.timestamp, str):
            self.timestamp = datetime.fromisoformat(self.timestamp)


@dataclass
class SimulationStartedEvent(DomainEvent):
    """Event fired when a simulation starts."""
    simulation_id: str
    agent_count: int
    seed: int

    def __init__(self, simulation_id: str, agent_count: int, seed: int):
        super().__init__(
            event_type="simulation_started",
            timestamp=datetime.now(),
            event_id=f"sim_start_{simulation_id}",
            data={
                "simulation_id": simulation_id,
                "agent_count": agent_count,
                "seed": seed
            }
        )
        self.simulation_id = simulation_id
        self.agent_count = agent_count
        self.seed = seed


@dataclass
class ActionExecutedEvent(DomainEvent):
    """Event fired when an action is executed."""
    simulation_id: str
    turn: int
    actor_id: int
    action_type: str
    target_id: Optional[int]
    outcome: str
    rule_justification: str

    def __init__(self, simulation_id: str, turn: int, actor_id: int,
                 action_type: str, target_id: Optional[int], outcome: str,
                 rule_justification: str, details: Dict[str, Any] = None):
        data = {
            "simulation_id": simulation_id,
            "turn": turn,
            "actor_id": actor_id,
            "action_type": action_type,
            "target_id": target_id,
            "outcome": outcome,
            "rule_justification": rule_justification,
            "details": details or {},
            "narrative": narrative  # Store narrative in data
        }

        # Generate narrative from event data
        event_for_narration = {
            "turn": turn,
            "actor": actor_id,
            "action": action_type,
            "target": target_id,
            "outcome": outcome,
            "rule_justification": rule_justification,
            "details": details or {}
        }
        from app.services.event_narrator import EventNarrator
        narrative = EventNarrator.narrate_event(event_for_narration)

        super().__init__(
            event_type="action_executed",
            timestamp=datetime.now(),
            event_id=f"action_{simulation_id}_{turn}_{actor_id}",
            data=data
        )
        self.simulation_id = simulation_id
        self.turn = turn
        self.actor_id = actor_id
        self.action_type = action_type
        self.target_id = target_id
        self.outcome = outcome
        self.rule_justification = rule_justification


@dataclass
class AgentDiedEvent(DomainEvent):
    """Event fired when an agent dies."""
    simulation_id: str
    turn: int
    agent_id: int
    cause: str

    def __init__(self, simulation_id: str, turn: int, agent_id: int, cause: str):
        super().__init__(
            event_type="agent_died",
            timestamp=datetime.now(),
            event_id=f"death_{simulation_id}_{turn}_{agent_id}",
            data={
                "simulation_id": simulation_id,
                "turn": turn,
                "agent_id": agent_id,
                "cause": cause
            }
        )
        self.simulation_id = simulation_id
        self.turn = turn
        self.agent_id = agent_id
        self.cause = cause


@dataclass
class RuleChangedEvent(DomainEvent):
    """Event fired when a rule is changed."""
    simulation_id: str
    turn: int
    rule_id: str
    change_type: str  # "added", "modified", "removed"
    old_value: Any
    new_value: Any

    def __init__(self, simulation_id: str, turn: int, rule_id: str,
                 change_type: str, old_value: Any = None, new_value: Any = None):
        super().__init__(
            event_type="rule_changed",
            timestamp=datetime.now(),
            event_id=f"rule_{simulation_id}_{turn}_{rule_id}",
            data={
                "simulation_id": simulation_id,
                "turn": turn,
                "rule_id": rule_id,
                "change_type": change_type,
                "old_value": old_value,
                "new_value": new_value
            }
        )
        self.simulation_id = simulation_id
        self.turn = turn
        self.rule_id = rule_id
        self.change_type = change_type
        self.old_value = old_value
        self.new_value = new_value


class EventBus:
    """Simple event bus for publishing domain events."""

    def __init__(self):
        self._handlers: Dict[str, List[Callable]] = {}
        self._events: List[DomainEvent] = []

    def subscribe(self, event_type: str, handler: Callable) -> None:
        """Subscribe to an event type."""
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)

    def publish(self, event: DomainEvent) -> None:
        """Publish an event to all subscribers."""
        self._events.append(event)

        if event.event_type in self._handlers:
            for handler in self._handlers[event.event_type]:
                try:
                    handler(event)
                except Exception as e:
                    logging.error(f"Error in event handler: {e}")

    def get_events(self, event_type: Optional[str] = None) -> List[DomainEvent]:
        """Get all events, optionally filtered by type."""
        if event_type:
            return [e for e in self._events if e.event_type == event_type]
        return self._events.copy()

    def clear(self) -> None:
        """Clear all events."""
        self._events.clear()


class EventLogger:
    """Logger for domain events."""

    def __init__(self, event_bus: EventBus):
        self.event_bus = event_bus
        self.event_bus.subscribe("*", self._log_event)
        self.logger = logging.getLogger("domain_events")

    def _log_event(self, event: DomainEvent) -> None:
        """Log a domain event."""
        # Get narrative from data dict if available
        narrative = event.data.get('narrative', '')

        if not narrative:
            # Fallback: try to generate narrative from event data
            event_data = {
                "turn": getattr(event, 'turn', event.data.get('turn', 0)),
                "actor": getattr(event, 'actor_id', getattr(event, 'agent_id', event.data.get('actor_id', -1))),
                "action": getattr(event, 'action_type', getattr(event, 'event_type', event.data.get('action_type', 'unknown'))),
                "target": getattr(event, 'target_id', event.data.get('target_id')),
                "outcome": getattr(event, 'outcome', getattr(event, 'cause', event.data.get('outcome', 'unknown'))),
                "rule_justification": getattr(event, 'rule_justification', event.data.get('rule_justification', '')),
                "details": event.data.get('details', event.data)
            }
            from app.services.event_narrator import EventNarrator
            narrative = EventNarrator.narrate_event(event_data)

        self.logger.info(
            f"Event: {event.event_type} | ID: {event.event_id} | "
            f"Time: {event.timestamp.isoformat()} | Narrative: {narrative} | Data: {json.dumps(event.data, default=str)}"
        )


# Global event bus instance
_event_bus_instance: Optional[EventBus] = None


def get_event_bus() -> EventBus:
    """Get the global event bus instance."""
    global _event_bus_instance
    if _event_bus_instance is None:
        _event_bus_instance = EventBus()
        # Add event logger
        EventLogger(_event_bus_instance)
    return _event_bus_instance