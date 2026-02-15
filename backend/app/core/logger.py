from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass, field
from typing import Any

# Removed import to break circular import
# from ..services.event_narrator import EventNarrator


EXTERNAL_ACTION_LABELS = {
    "ATTACK": "ELIMINATE",
}


@dataclass
class EventLogger:
    events: list[dict[str, Any]] = field(default_factory=list)

    def log(
        self,
        *,
        turn: int,
        actor: int,
        action: str,
        target: int | None,
        outcome: str,
        rule_justification: str,
        details: dict[str, Any] | None = None,
    ) -> None:
        entry = {
            "turn": turn,
            "actor": actor,
            "action": EXTERNAL_ACTION_LABELS.get(action, action),
            "target": target,
            "outcome": outcome,
            "rule_justification": rule_justification,
            "details": details or {},
        }
        # Add human-readable narrative
        from ..services.event_narrator import EventNarrator
        entry["narrative"] = EventNarrator.narrate_event(entry)
        self.events.append(entry)

    def digest(self) -> str:
        payload = json.dumps(self.events, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()
