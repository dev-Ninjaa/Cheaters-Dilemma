from __future__ import annotations

from ..domain.actions import Action, ActionType
from ..domain.agent import Agent, AgentObservation


class WarlordAgent(Agent):
    name = "warlord"

    def decide(self, obs: AgentObservation, rng) -> Action:
        # Health management - REST if health is low
        if obs.self_health < 20 and rng.random() < 0.7:
            return Action(actor=obs.self_id, kind=ActionType.REST)

        if obs.pending_proposal is not None:
            key = obs.pending_proposal.get("key")
            if key in {"attack_cost", "attack_success_base"}:
                vote = "yes" if key == "attack_success_base" else "no"
                return Action(actor=obs.self_id, kind=ActionType.VOTE_RULE, payload={"vote": vote})
            return Action(actor=obs.self_id, kind=ActionType.VOTE_RULE, payload={"vote": "no"})

        others = [aid for aid in obs.alive_ids if aid != obs.self_id]
        if not others:
            return Action(actor=obs.self_id, kind=ActionType.WORK)

        late_game = len(obs.alive_ids) <= max(3, len(obs.token_balance_by_agent) // 3)
        if late_game and obs.self_token_balance >= obs.current_rules.get("attack_cost", 5) and rng.random() < 0.55:
            # Target weakest agent (considering health)
            target = min(others, key=lambda aid: obs.strength_by_agent[aid] + obs.token_balance_by_agent[aid] - obs.health_by_agent[aid])
            return Action(actor=obs.self_id, kind=ActionType.ATTACK, target=target)

        if obs.self_token_balance >= obs.current_rules.get("attack_cost", 5) * 2 and rng.random() < 0.04:
            # Target low health agents
            target = min(others, key=lambda aid: obs.health_by_agent[aid])
            return Action(actor=obs.self_id, kind=ActionType.ATTACK, target=target)

        if rng.random() < 0.1:
            return Action(
                actor=obs.self_id,
                kind=ActionType.PROPOSE_RULE,
                payload={"key": "attack_success_base", "value": min(0.4, float(obs.current_rules.get("attack_success_base", 0.12)) + 0.02)},
            )

        if rng.random() < 0.3:
            target = max(others, key=lambda aid: obs.token_balance_by_agent[aid])
            return Action(actor=obs.self_id, kind=ActionType.STEAL, target=target)

        return Action(actor=obs.self_id, kind=ActionType.WORK)
