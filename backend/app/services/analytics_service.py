from __future__ import annotations

from typing import Any

from .metrics_service import MetricsService


class AnalyticsService:
    """Service for generating analytics and summaries from simulation results."""

    @staticmethod
    def generate_leaderboard_lines(result: dict[str, Any], limit: int = 10) -> list[str]:
        """Generate formatted leaderboard lines for display."""
        lines = []
        for idx, row in enumerate(result["leaderboard"][:limit], start=1):
            state = "alive" if row["alive"] else "removed"
            lines.append(
                f"{idx:>2}. agent={row['agent_id']:>2} type={row['strategy']:<10} "
                f"tokens={row['resources']:<4} str={row['strength']:<2} {state:<10} "
                f"trust={row['trust']:.2f} aggr={row['aggression']:.2f}"
            )
        return lines

    @staticmethod
    def summarize_result(result: dict[str, Any]) -> dict[str, Any]:
        """Generate a comprehensive summary of simulation results."""
        metrics = MetricsService.compute_metrics(result)
        governance = metrics["governance_capture"]
        timeline = metrics["timeline_markers"]
        winner = metrics["winner_analysis"]
        turns = result.get("turns_completed")
        seed = result.get("seed")
        agent_count = len(result.get("leaderboard", []))

        judge_lines = [
            "Canonical demo scenario: seed=42 agents=10 turns=500",
            f"Run metadata: seed={seed} agents={agent_count} turns={turns}",
            f"First rule change turn: {timeline['first_rule_change_turn']}",
            f"First removal turn: {timeline['first_removal_turn']}",
            f"Final Gini coefficient: {metrics['gini_token_balance']}",
            (
                f"Winner: agent={winner['winner_id']} strategy={winner['winner_strategy']} "
                f"won via {winner['winner_reason']}"
            ),
            (
                "Governance capture: "
                f"{governance['accepted_rules_by_top2_percent']}% of accepted rules came from top-2 agents"
            ),
        ]
        return {
            "leaderboard_lines": AnalyticsService.generate_leaderboard_lines(result),
            "judge_lines": judge_lines,
            "metrics": metrics,
        }
