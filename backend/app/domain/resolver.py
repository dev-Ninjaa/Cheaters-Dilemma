from __future__ import annotations

from dataclasses import dataclass
from random import Random
from typing import List, Dict, Any

from ..core.rules import RuleSet
from app.services.blockchain_service import blockchain_service


@dataclass
class TransferRecord:
    """Record of a token transfer for batch execution."""
    from_agent: int
    to_agent: int
    amount: int
    turn: int


@dataclass
class ConflictResolver:
    rules: RuleSet
    transfer_log: List[TransferRecord] = None
    
    def __post_init__(self):
        if self.transfer_log is None:
            self.transfer_log = []

    def resolve_work(self, actor: int, token_balances: dict[int, int], rng: Random) -> dict[str, object]:
        low, high = self.rules.values.get("work_income", [2, 4])
        gain = rng.randint(int(low), int(high))
        token_balances[actor] += gain
        return {"success": True, "gain": gain}
    
    def resolve_rest(self, actor: int, health: dict[int, int]) -> dict[str, object]:
        """Resolve REST action - heal +10 health."""
        max_health = 50
        current_health = health.get(actor, max_health)
        heal_amount = min(10, max_health - current_health)
        health[actor] = min(max_health, current_health + 10)
        return {"success": True, "heal": heal_amount, "new_health": health[actor]}

    def resolve_steal(
        self,
        actor: int,
        target: int,
        token_balances: dict[int, int],
        strength: dict[int, int],
        rng: Random,
        current_turn: int = 0,
    ) -> dict[str, object]:
        if token_balances.get(target, 0) <= 0:
            return {"success": False, "reason": "target_has_no_resources", "amount": 0}

        steal_cap = int(self.rules.values.get("steal_amount", 3))
        take = min(steal_cap, token_balances[target])
        base = float(self.rules.values.get("steal_success_base", 0.45))
        catch_prob = float(self.rules.values.get("steal_catch_prob", 0.25))
        strength_edge = (strength[actor] - strength[target]) * 0.03
        success_p = min(0.9, max(0.05, base + strength_edge))

        if rng.random() < success_p:
            token_balances[target] -= take
            token_balances[actor] += take
            # Record transfer for batch execution at simulation end
            self.transfer_log.append(TransferRecord(
                from_agent=target,
                to_agent=actor,
                amount=take,
                turn=current_turn
            ))
            if rng.random() < catch_prob:
                penalty = min(token_balances[actor], int(self.rules.values.get("steal_catch_penalty", 2)))
                token_balances[actor] -= penalty
                return {
                    "success": True,
                    "reason": "caught_after_success",
                    "amount": take,
                    "penalty": penalty,
                }
            return {"success": True, "reason": "clean_success", "amount": take}

        fail_penalty = min(token_balances[actor], int(self.rules.values.get("steal_fail_penalty", 1)))
        token_balances[actor] -= fail_penalty
        return {"success": False, "reason": "failed", "amount": 0, "penalty": fail_penalty}

    def execute_batch_transfers(self) -> Dict[str, Any]:
        """Execute all recorded transfers on-chain at the end of simulation."""
        if not self.transfer_log:
            return {"executed": 0, "failed": 0, "total_transfers": 0}
        
        executed = 0
        failed = 0
        
        print(f"🚀 Executing {len(self.transfer_log)} batched token transfers on-chain...")
        
        for transfer in self.transfer_log:
            try:
                # match blockchain_service.transfer_tokens parameter names
                success = blockchain_service.transfer_tokens(
                    from_agent_id=transfer.from_agent,
                    to_agent_id=transfer.to_agent,
                    amount=transfer.amount,
                )

                if success:
                    executed += 1
                    print(f"✅ Transfer: Agent {transfer.from_agent} → Agent {transfer.to_agent} ({transfer.amount} DLM)")
                else:
                    failed += 1
                    print(f"❌ Transfer failed: Agent {transfer.from_agent} → Agent {transfer.to_agent}")
            except Exception as e:
                failed += 1
                print(f"❌ Transfer error: {e}")
        
        print(f"📊 Batch transfer complete: {executed} successful, {failed} failed")
        return {
            "executed": executed,
            "failed": failed,
            "total_transfers": len(self.transfer_log)
        }

    def resolve_attack(
        self,
        actor: int,
        target: int,
        token_balances: dict[int, int],
        strength: dict[int, int],
        alive: set[int],
        health: dict[int, int],
        kills: dict[int, int],
        rng: Random,
    ) -> dict[str, object]:
        cost = int(self.rules.values.get("attack_cost", 5))
        token_balances[actor] -= cost
        
        # Calculate damage based on strength
        base_damage = 20
        strength_bonus = (strength[actor] - strength[target]) * 2
        damage = max(5, base_damage + strength_bonus)

        base = float(self.rules.values.get("attack_success_base", 0.12))
        edge = (strength[actor] - strength[target]) * 0.04
        success_p = min(0.75, max(0.01, base + edge))

        if rng.random() < success_p:
            # Deal damage
            current_health = health.get(target, 50)
            health[target] = max(0, current_health - damage)
            
            # Check if target is eliminated
            eliminated = health[target] <= 0
            if eliminated and target in alive:
                alive.remove(target)
                kills[actor] = kills.get(actor, 0) + 1  # Increment kills
                loot_ratio = float(self.rules.values.get("attack_loot_ratio", 0.4))
                loot = int(token_balances[target] * loot_ratio)
                token_balances[target] -= loot
                token_balances[actor] += loot
                return {"success": True, "reason": "target_eliminated", "loot": loot, "damage": damage, "target_health": 0}
            
            return {"success": True, "reason": "target_damaged", "damage": damage, "target_health": health[target]}

        recoil = min(token_balances[actor], int(self.rules.values.get("attack_fail_penalty", 2)))
        token_balances[actor] -= recoil
        return {"success": False, "reason": "attack_failed", "penalty": recoil}
    
    def resolve_coalition_attack(
        self,
        actors: list[int],
        target: int,
        token_balances: dict[int, int],
        strength: dict[int, int],
        alive: set[int],
        health: dict[int, int],
        kills: dict[int, int],
        rng: Random,
    ) -> dict[str, object]:
        """Resolve coalition attack - multiple agents attacking together."""
        cost = int(self.rules.values.get("attack_cost", 5))
        
        # Each actor pays cost
        for actor in actors:
            token_balances[actor] -= cost
        
        # Combined strength
        combined_strength = sum(strength[actor] for actor in actors)
        target_strength = strength[target]
        
        # Higher success rate for coalition
        base = float(self.rules.values.get("attack_success_base", 0.12))
        coalition_bonus = len(actors) * 0.15  # +15% per additional attacker
        edge = (combined_strength - target_strength) * 0.04
        success_p = min(0.95, base + coalition_bonus + edge)
        
        # Higher damage
        base_damage = 30
        strength_bonus = (combined_strength - target_strength) * 2
        damage = max(10, base_damage + strength_bonus)
        
        if rng.random() < success_p:
            current_health = health.get(target, 50)
            health[target] = max(0, current_health - damage)
            
            eliminated = health[target] <= 0
            if eliminated and target in alive:
                alive.remove(target)
                # Each actor gets a kill
                for actor in actors:
                    kills[actor] = kills.get(actor, 0) + 1
                loot_ratio = float(self.rules.values.get("attack_loot_ratio", 0.4))
                loot = int(token_balances[target] * loot_ratio)
                token_balances[target] -= loot
                
                # Split loot among attackers
                loot_per_actor = loot // len(actors)
                for actor in actors:
                    token_balances[actor] += loot_per_actor
                
                return {
                    "success": True,
                    "reason": "target_eliminated",
                    "loot": loot,
                    "loot_per_actor": loot_per_actor,
                    "damage": damage,
                    "target_health": 0,
                    "coalition_size": len(actors)
                }
            
            return {
                "success": True,
                "reason": "target_damaged",
                "damage": damage,
                "target_health": health[target],
                "coalition_size": len(actors)
            }
        
        # Failed attack - each actor loses penalty
        recoil = int(self.rules.values.get("attack_fail_penalty", 2))
        for actor in actors:
            penalty = min(token_balances[actor], recoil)
            token_balances[actor] -= penalty
        
        return {"success": False, "reason": "coalition_attack_failed", "penalty": recoil, "coalition_size": len(actors)}
    
    def resolve_trade(
        self,
        actor: int,
        target: int,
        offer_amount: int,
        request_amount: int,
        token_balances: dict[int, int],
    ) -> dict[str, object]:
        """Resolve trade between two agents."""
        # Check if both agents have sufficient tokens
        if token_balances.get(actor, 0) < offer_amount:
            return {"success": False, "reason": "insufficient_tokens_actor"}
        
        if token_balances.get(target, 0) < request_amount:
            return {"success": False, "reason": "insufficient_tokens_target"}
        
        # Execute trade
        token_balances[actor] -= offer_amount
        token_balances[actor] += request_amount
        token_balances[target] += offer_amount
        token_balances[target] -= request_amount
        
        return {
            "success": True,
            "actor_gave": offer_amount,
            "actor_received": request_amount,
            "target_gave": request_amount,
            "target_received": offer_amount
        }
