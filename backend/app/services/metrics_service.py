from __future__ import annotations

from collections import Counter
from typing import Any


class MetricsService:
    """Service for calculating various metrics and statistics."""

    @staticmethod
    def calculate_gini(values: list[float]) -> float:
        """Calculate Gini coefficient for inequality measurement."""
        clean = [v for v in values if v >= 0]
        if not clean:
            return 0.0
        sorted_vals = sorted(clean)
        n = len(sorted_vals)
        total = sum(sorted_vals)
        if total == 0:
            return 0.0
        weighted = sum((i + 1) * x for i, x in enumerate(sorted_vals))
        return round((2 * weighted) / (n * total) - (n + 1) / n, 6)

    @staticmethod
    def calculate_hhi(values: list[float]) -> float:
        """Calculate Herfindahl-Hirschman Index for concentration."""
        total = sum(values)
        if total <= 0:
            return 0.0
        shares = [(v / total) * 100 for v in values]
        return round(sum(s * s for s in shares), 3)

    @staticmethod
    def calculate_top_share(values: list[float], k: int = 1) -> float:
        """Calculate share held by top k values."""
        if not values:
            return 0.0
    @staticmethod
    def calculate_strategy_frequency(leaderboard: list[dict[str, Any]]) -> dict[str, int]:
        """Calculate frequency of each strategy in the leaderboard."""
        ctr = Counter(row["strategy"] for row in leaderboard)
        return dict(sorted(ctr.items()))

    @staticmethod
    def _calculate_external_action_frequency(action_counts: dict[str, int]) -> dict[str, int]:
        """Map internal action names to external names for reporting."""
        mapped: dict[str, int] = {}
        for key, value in action_counts.items():
            out_key = "ELIMINATE" if key == "ATTACK" else key
            mapped[out_key] = mapped.get(out_key, 0) + value
        return mapped

    @staticmethod
    def _calculate_governance_capture_metrics(result: dict[str, Any]) -> dict[str, Any]:
        """Calculate metrics related to governance capture."""
        events = result.get("events", [])
        leaderboard = result.get("leaderboard", [])
        top2_ids = {row["agent_id"] for row in leaderboard[:2]}

        proposal_rank_by_id: dict[int, int] = {}
        proposer_by_id: dict[int, int] = {}
        passed_proposers: list[int] = []
        rank_attempts: Counter[int] = Counter()
        rank_passes: Counter[int] = Counter()
        accepted_by_top2 = 0
        accepted_total = 0

        for event in events:
            if event.get("action") == "PROPOSE_RULE":
                pid = event.get("details", {}).get("proposal_id")
                rank = event.get("details", {}).get("actor_rank")
                actor = event.get("actor")
                if isinstance(pid, int):
                    proposer_by_id[pid] = int(actor)
                    if isinstance(rank, int):
                        proposal_rank_by_id[pid] = rank
                        rank_attempts[rank] += 1

            if event.get("action") == "RULE_CHANGE" and event.get("outcome") == "proposal_passed":
                proposal = event.get("details", {}).get("proposal", {})
                pid = proposal.get("proposal_id")
                proposer = proposal.get("actor")
                if isinstance(proposer, int):
                    passed_proposers.append(proposer)
                    accepted_total += 1
                    if proposer in top2_ids:
                        accepted_by_top2 += 1
                if isinstance(pid, int) and pid in proposal_rank_by_id:
                    rank_passes[proposal_rank_by_id[pid]] += 1

        by_rank: dict[str, float] = {}
        for rank in sorted(rank_attempts):
            attempts = rank_attempts[rank]
            by_rank[f"rank_{rank}"] = round((rank_passes[rank] / attempts) if attempts else 0.0, 4)

        proposer_counts = Counter(passed_proposers)
        concentration_hhi = 0.0
        if accepted_total > 0:
            shares = [(count / accepted_total) * 100.0 for count in proposer_counts.values()]
            concentration_hhi = round(sum(s * s for s in shares), 3)

        capture_percent = round((accepted_by_top2 / accepted_total) * 100.0, 2) if accepted_total else 0.0
        return {
            "accepted_rule_count": accepted_total,
            "accepted_rules_by_top2_percent": capture_percent,
            "proposal_acceptance_rate_by_rank": by_rank,
            "governance_power_hhi": concentration_hhi,
        }

    @staticmethod
    def _calculate_timeline_markers(result: dict[str, Any]) -> dict[str, Any]:
        """Calculate timeline markers for key events."""
        first_rule_change_turn = None
        first_removal_turn = None

        for event in result.get("events", []):
            if first_rule_change_turn is None and event.get("action") == "RULE_CHANGE" and event.get("outcome") == "proposal_passed":
                first_rule_change_turn = event.get("turn")
            if first_removal_turn is None and event.get("action") == "ELIMINATE":
                details = event.get("details", {})
                if event.get("outcome") == "success" and details.get("reason") == "target_eliminated":
                    first_removal_turn = event.get("turn")
            if first_rule_change_turn is not None and first_removal_turn is not None:
                break

        return {
            "first_rule_change_turn": first_rule_change_turn,
            "first_removal_turn": first_removal_turn,
        }

    @staticmethod
    def _calculate_winner_reason(result: dict[str, Any]) -> dict[str, Any]:
        """Analyze why the winner won."""
        leaderboard = result.get("leaderboard", [])
        if not leaderboard:
            return {"winner_id": None, "winner_strategy": None, "winner_reason": "resources"}

        winner = leaderboard[0]
        wid = winner["agent_id"]
        governance = 0
        force = 0
        resource_gain = 0

        for event in result.get("events", []):
            if event.get("actor") != wid:
                continue
            if event.get("action") == "RULE_CHANGE" and event.get("outcome") == "proposal_passed":
                governance += 1
            if event.get("action") == "ELIMINATE" and event.get("outcome") == "success":
                if event.get("details", {}).get("reason") == "target_eliminated":
                    force += 1
            if event.get("action") == "WORK" and event.get("outcome") == "success":
                resource_gain += int(event.get("details", {}).get("gain", 0))
            if event.get("action") == "STEAL" and event.get("outcome") == "success":
                resource_gain += int(event.get("details", {}).get("amount", 0))

        reason = "resources"
        if governance >= max(2, force + 1):
            reason = "governance"
        elif force >= 2:
            reason = "force"

        return {
            "winner_id": wid,
            "winner_strategy": winner["strategy"],
            "winner_reason": reason,
            "winner_governance_changes": governance,
            "winner_removals": force,
            "winner_work_steal_gain": resource_gain,
        }

    @staticmethod
    def compute_metrics(result: dict[str, Any]) -> dict[str, Any]:
        """Compute comprehensive metrics for a simulation result."""
        token_balances = [row["resources"] for row in result["leaderboard"]]
        alive_count = sum(1 for row in result["leaderboard"] if row["alive"])
        governance = MetricsService._calculate_governance_capture_metrics(result)
        timeline = MetricsService._calculate_timeline_markers(result)
        winner = MetricsService._calculate_winner_reason(result)

        return {
            "gini_token_balance": MetricsService.calculate_gini(token_balances),
            "hhi_token_balance": MetricsService.calculate_hhi(token_balances),
            "top1_share": MetricsService.calculate_top_share(token_balances, 1),
            "top3_share": MetricsService.calculate_top_share(token_balances, 3),
            "alive_count": alive_count,
            "strategy_frequency": MetricsService.calculate_strategy_frequency(result["leaderboard"]),
            "action_frequency": MetricsService._calculate_external_action_frequency(result.get("action_counts", {})),
            "governance_capture": governance,
            "timeline_markers": timeline,
            "winner_analysis": winner,
            "event_count": result.get("event_count", 0),
            "rules_version": result.get("rules_version", 1),
            "log_digest": result.get("log_digest"),
        }
