from __future__ import annotations

from ..domain.actions import Action, ActionType
from ..domain.agent import Agent, AgentObservation


class CheaterAgent(Agent):
    name = "cheater"

    def decide(self, obs: AgentObservation, rng) -> Action:
        # Health management - REST if health is low
        if obs.self_health < 25 and rng.random() < 0.4:
            return Action(actor=obs.self_id, kind=ActionType.REST)

        if obs.pending_proposal is not None:
            key = obs.pending_proposal.get("key")
            if key in {"steal_amount", "steal_success_base"}:
                return Action(actor=obs.self_id, kind=ActionType.VOTE_RULE, payload={"vote": "yes"})
            if key == "steal_catch_penalty":
                return Action(actor=obs.self_id, kind=ActionType.VOTE_RULE, payload={"vote": "no"})
            return Action(actor=obs.self_id, kind=ActionType.VOTE_RULE, payload={"vote": "yes" if rng.random() < 0.5 else "no"})

        if obs.last_harm_from is not None and obs.last_harm_from in obs.alive_ids:
            if rng.random() < 0.55:
                return Action(actor=obs.self_id, kind=ActionType.STEAL, target=obs.last_harm_from)

        targets = [aid for aid in obs.alive_ids if aid != obs.self_id and obs.token_balance_by_agent[aid] > 0]
        if targets and obs.self_token_balance >= obs.current_rules.get("steal_min_token_balance", 0):
            target = max(targets, key=lambda aid: obs.token_balance_by_agent[aid] + int((1 - obs.trust_by_agent[aid]) * 3))
            return Action(actor=obs.self_id, kind=ActionType.STEAL, target=target)

        if rng.random() < 0.08:
            return Action(
                actor=obs.self_id,
                kind=ActionType.PROPOSE_RULE,
                payload={"key": "steal_amount", "value": int(obs.current_rules.get("steal_amount", 3)) + 1},
            )

        return Action(actor=obs.self_id, kind=ActionType.WORK)
