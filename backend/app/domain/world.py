from __future__ import annotations

from dataclasses import dataclass
from random import Random
from typing import Any

from .actions import Action, ActionType
from .agent import Agent, AgentObservation
from ..core.governance import GovernanceSystem
from ..core.logger import EventLogger
from ..core.reputation import ReputationBook
from .resolver import ConflictResolver
from ..core.rules import RuleSet


@dataclass
class AgentSlot:
    agent_id: int
    brain: Agent
    label: str


class World:
    def __init__(
        self,
        *,
        agents: list[Agent],
        rules: dict[str, Any],
        max_turns: int,
        seed: int,
        initial_resource_range: list[int],
        strength_range: list[int],
        enable_new_features: bool = False,  # Backward compatibility flag
    ) -> None:
        self.seed = seed
        self.rng = Random(seed)
        self.max_turns = max_turns
        self.enable_new_features = enable_new_features

        self.rule_set = RuleSet(values=rules)
        self.logger = EventLogger()
        self.reputation = ReputationBook()
        self.governance = GovernanceSystem(rules=self.rule_set)
        self.resolver = ConflictResolver(rules=self.rule_set)

        self.agent_slots: list[AgentSlot] = [
            AgentSlot(agent_id=i, brain=agent, label=agent.name) for i, agent in enumerate(agents)
        ]
        self.token_balances: dict[int, int] = {
            slot.agent_id: self.rng.randint(int(initial_resource_range[0]), int(initial_resource_range[1]))
            for slot in self.agent_slots
        }
        self.strength: dict[int, int] = {
            slot.agent_id: self.rng.randint(int(strength_range[0]), int(strength_range[1]))
            for slot in self.agent_slots
        }
        self.alive: set[int] = {slot.agent_id for slot in self.agent_slots}
        self.reputation.bootstrap(sorted(self.alive))

        # New features (only if enabled)
        self.health: dict[int, int] = {slot.agent_id: 50 for slot in self.agent_slots}
        self.kills: dict[int, int] = {slot.agent_id: 0 for slot in self.agent_slots}
        self.positions: dict[int, tuple] = {slot.agent_id: (0, 0) for slot in self.agent_slots}
        self.alliances: list = []  # List of Alliance objects
        self.alliance_proposals: dict[int, list] = {}  # Pending alliance proposals

        self.action_counts: dict[str, int] = {kind.value: 0 for kind in ActionType}
        self.turns_completed: int = 0

    def _rank_of(self, agent_id: int) -> int:
        ordered = sorted(self.alive, key=lambda aid: (-self.token_balances[aid], aid))
        return ordered.index(agent_id) + 1
    
    def _get_active_alliances_for(self, agent_id: int) -> list:
        """Get all active alliances involving this agent."""
        return [a for a in self.alliances if a.active and a.involves_agent(agent_id)]
    
    def _are_allied(self, agent1_id: int, agent2_id: int) -> bool:
        """Check if two agents are allied."""
        for alliance in self.alliances:
            if alliance.active and alliance.involves_agent(agent1_id) and alliance.involves_agent(agent2_id):
                return True
        return False
    
    def _form_alliance(self, agent1_id: int, agent2_id: int, turn: int) -> tuple[bool, str]:
        """Form an alliance between two agents."""
        if self._are_allied(agent1_id, agent2_id):
            return False, "already_allied"
        
        # Calculate trust level
        trust1 = self.reputation.trust.get(agent1_id, 0.5)
        trust2 = self.reputation.trust.get(agent2_id, 0.5)
        trust_level = (trust1 + trust2) / 2
        
        # Combined strength
        combined_strength = self.strength[agent1_id] + self.strength[agent2_id]
        
        from .models import Alliance
        alliance = Alliance(
            agent1_id=agent1_id,
            agent2_id=agent2_id,
            trust_level=trust_level,
            strength=combined_strength,
            formed_turn=turn,
            active=True
        )
        self.alliances.append(alliance)
        return True, "alliance_formed"
    
    def _break_alliance(self, agent1_id: int, agent2_id: int, turn: int) -> tuple[bool, str]:
        """Break an alliance between two agents."""
        for alliance in self.alliances:
            if alliance.active and alliance.involves_agent(agent1_id) and alliance.involves_agent(agent2_id):
                alliance.active = False
                alliance.broken_turn = turn
                return True, "alliance_broken"
        return False, "no_alliance_found"

    def _observation_for(self, slot: AgentSlot, turn: int) -> AgentObservation:
        aid = slot.agent_id
        alive_ids = tuple(sorted(self.alive))
        return AgentObservation(
            turn=turn,
            self_id=aid,
            self_token_balance=self.token_balances[aid],
            self_strength=self.strength[aid],
            self_rank=self._rank_of(aid),
            self_health=self.health.get(aid, 50),
            alive_ids=alive_ids,
            token_balance_by_agent={i: self.token_balances[i] for i in alive_ids},
            strength_by_agent={i: self.strength[i] for i in alive_ids},
            health_by_agent={i: self.health.get(i, 50) for i in alive_ids},
            trust_by_agent={i: self.reputation.trust[i] for i in alive_ids},
            aggression_by_agent={i: self.reputation.aggression[i] for i in alive_ids},
            current_rules=dict(self.rule_set.values),
            pending_proposal=dict(self.governance.pending) if self.governance.pending else None,
            last_harm_from=self.reputation.last_harm_from.get(aid),
        )

    def _validate_target(self, actor: int, target: int | None) -> tuple[bool, str]:
        if target is None:
            return False, "missing_target"
        if target == actor:
            return False, "self_target_not_allowed"
        if target not in self.alive:
            return False, "target_not_alive"
        return True, "target_valid"

    def _log_action(self, turn: int, action: Action, outcome: str, reason: str, details: dict[str, Any] | None = None) -> None:
        payload = dict(details or {})
        if action.actor in self.alive:
            payload["actor_rank"] = self._rank_of(action.actor)
        self.logger.log(
            turn=turn,
            actor=action.actor,
            action=action.kind.value,
            target=action.target,
            outcome=outcome,
            rule_justification=reason,
            details=payload,
        )

    def _try_governance_resolution(self, turn: int, force: bool = False) -> None:
        changed, status, proposal = self.governance.try_resolve(sorted(self.alive), turn, force=force, token_balances=self.token_balances)
        if not changed:
            return
        actor = int(proposal["actor"]) if proposal else -1
        self.logger.log(
            turn=turn,
            actor=actor,
            action="RULE_CHANGE" if status == "proposal_passed" else "RULE_VOTE_RESULT",
            target=None,
            outcome=status,
            rule_justification="simple_majority",
            details={
                "proposal": proposal,
                "rules_version": self.rule_set.version,
            },
        )

    def step(self) -> bool:
        """Run one turn of the simulation. Returns True if the turn was executed, False if simulation is complete."""
        if len(self.alive) <= 1 or self.turns_completed >= self.max_turns:
            return False

        turn = self.turns_completed + 1

        for slot in self.agent_slots:
            actor = slot.agent_id
            if actor not in self.alive:
                continue

            obs = self._observation_for(slot, turn)
            action = slot.brain.decide(obs, self.rng)
            self.action_counts[action.kind.value] += 1

            valid, reason = self.rule_set.validate_action(
                action=action,
                actor_state={"token_balance": self.token_balances[actor]},
            )
            if not valid:
                self._log_action(turn, action, "blocked", reason)
                continue

            if action.kind == ActionType.WORK:
                outcome = self.resolver.resolve_work(actor, self.token_balances, self.rng)
                self.reputation.record_work(actor)
                self._log_action(turn, action, "success", reason, details=outcome)
                continue
            
            if action.kind == ActionType.REST and self.enable_new_features:
                outcome = self.resolver.resolve_rest(actor, self.health)
                self._log_action(turn, action, "success", reason, details=outcome)
                continue
            
            if action.kind == ActionType.FORM_ALLIANCE and self.enable_new_features:
                target_ok, target_reason = self._validate_target(actor, action.target)
                if not target_ok:
                    self._log_action(turn, action, "blocked", target_reason)
                    continue
                success, alliance_reason = self._form_alliance(actor, int(action.target), turn)
                status = "success" if success else "failed"
                self._log_action(turn, action, status, alliance_reason, details={"partner": action.target})
                continue
            
            if action.kind == ActionType.BREAK_ALLIANCE and self.enable_new_features:
                target_ok, target_reason = self._validate_target(actor, action.target)
                if not target_ok:
                    self._log_action(turn, action, "blocked", target_reason)
                    continue
                success, alliance_reason = self._break_alliance(actor, int(action.target), turn)
                status = "success" if success else "failed"
                self._log_action(turn, action, status, alliance_reason, details={"partner": action.target})
                continue
            
            if action.kind == ActionType.TRADE and self.enable_new_features:
                target_ok, target_reason = self._validate_target(actor, action.target)
                if not target_ok:
                    self._log_action(turn, action, "blocked", target_reason)
                    continue
                offer = action.payload.get("offer", 0)
                request = action.payload.get("request", 0)
                result = self.resolver.resolve_trade(
                    actor, int(action.target), offer, request, self.token_balances
                )
                status = "success" if result["success"] else "failed"
                self._log_action(turn, action, status, reason, details=result)
                continue
            
            if action.kind == ActionType.MOVE and self.enable_new_features:
                new_pos = action.payload.get("position", (0, 0))
                old_pos = self.positions[actor]
                self.positions[actor] = new_pos
                self._log_action(turn, action, "success", reason, details={
                    "from": old_pos,
                    "to": new_pos
                })
                continue
            
            if action.kind == ActionType.COALITION_ATTACK and self.enable_new_features:
                target_ok, target_reason = self._validate_target(actor, action.target)
                if not target_ok:
                    self._log_action(turn, action, "blocked", target_reason)
                    continue
                
                # Get allied agents
                allies = [actor]
                for alliance in self._get_active_alliances_for(actor):
                    partner = alliance.get_partner(actor)
                    if partner and partner in self.alive:
                        allies.append(partner)
                
                if len(allies) < 2:
                    self._log_action(turn, action, "blocked", "no_allies_available")
                    continue
                
                result = self.resolver.resolve_coalition_attack(
                    allies,
                    int(action.target),
                    self.token_balances,
                    self.strength,
                    self.alive,
                    self.health,
                    self.kills,
                    self.rng,
                )
                status = "success" if result["success"] else "failed"
                self._log_action(turn, action, status, reason, details=result)
                continue

            if action.kind == ActionType.STEAL:
                target_ok, target_reason = self._validate_target(actor, action.target)
                if not target_ok:
                    self._log_action(turn, action, "blocked", target_reason)
                    continue
                result = self.resolver.resolve_steal(
                    actor=actor,
                    target=int(action.target),
                    token_balances=self.token_balances,
                    strength=self.strength,
                    rng=self.rng,
                    current_turn=turn,
                )
                self.reputation.record_steal(actor, int(action.target), bool(result["success"]))
                status = "success" if result["success"] else "failed"
                self._log_action(turn, action, status, reason, details=result)
                continue

            if action.kind == ActionType.ATTACK:
                target_ok, target_reason = self._validate_target(actor, action.target)
                if not target_ok:
                    self._log_action(turn, action, "blocked", target_reason)
                    continue
                result = self.resolver.resolve_attack(
                    actor=actor,
                    target=int(action.target),
                    token_balances=self.token_balances,
                    strength=self.strength,
                    alive=self.alive,
                    health=self.health if self.enable_new_features else {},
                    kills=self.kills,
                    rng=self.rng,
                )
                self.reputation.record_attack(actor, int(action.target), bool(result["success"]))
                status = "success" if result["success"] else "failed"
                self._log_action(turn, action, status, reason, details=result)
                continue

            if action.kind == ActionType.PROPOSE_RULE:
                ok, proposal_reason = self.governance.propose(actor, action.payload, turn)
                status = "accepted" if ok else "rejected"
                proposal_id = self.governance.pending["proposal_id"] if ok and self.governance.pending else None
                self._log_action(
                    turn,
                    action,
                    status,
                    reason,
                    details={"proposal_reason": proposal_reason, "proposal_id": proposal_id},
                )
                self._try_governance_resolution(turn, force=False)
                continue

            if action.kind == ActionType.VOTE_RULE:
                ok, vote_reason = self.governance.vote(actor, action.payload.get("vote", ""))
                status = "accepted" if ok else "rejected"
                self._log_action(turn, action, status, reason, details={"vote_reason": vote_reason})
                self._try_governance_resolution(turn, force=False)
                continue

            self._log_action(turn, action, "noop", reason)

        self._try_governance_resolution(turn, force=True)
        self.turns_completed = turn
        return True

    def run(self) -> dict[str, Any]:
        while self.step():
            pass
        
        # Execute all recorded token transfers on-chain
        transfer_results = self.resolver.execute_batch_transfers()
        
        snapshot = self.snapshot()
        snapshot["blockchain_transfers"] = transfer_results
        return snapshot

    def snapshot(self) -> dict[str, Any]:
        leaderboard = sorted(
            (
                {
                    "agent_id": slot.agent_id,
                    "strategy": slot.label,
                    "resources": self.token_balances[slot.agent_id],  # Use resources for frontend display
                    "strength": self.strength[slot.agent_id],
                    "alive": slot.agent_id in self.alive,
                    "trust": round(self.reputation.trust[slot.agent_id], 4),
                    "aggression": round(self.reputation.aggression[slot.agent_id], 4),
                    "health": self.health.get(slot.agent_id, 50),
                    "kills": self.kills.get(slot.agent_id, 0),
                }
                for slot in self.agent_slots
            ),
            key=lambda row: (-row["resources"], row["agent_id"]),  # Sort by resources instead of token_balance
        )

        return {
            "seed": self.seed,
            "turns_completed": self.turns_completed,
            "rules_version": self.rule_set.version,
            "leaderboard": leaderboard,
            "alive": sorted(self.alive),
            "action_counts": dict(self.action_counts),
            "event_count": len(self.logger.events),
            "log_digest": self.logger.digest(),
            "events": self.logger.events,
        }
