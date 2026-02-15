from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parent
PARENT = ROOT.parent
if str(PARENT) not in sys.path:
    sys.path.insert(0, str(PARENT))

from app.agents.cheater import CheaterAgent
from app.agents.greedy import GreedyAgent
from app.agents.politician import PoliticianAgent
from app.agents.warlord import WarlordAgent
from app.services.analytics_service import AnalyticsService
from app.domain.world import World


CONFIG_DIR = PARENT / "app" / "config"


def _load_yaml(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def _build_agents(count: int):
    classes = [GreedyAgent, CheaterAgent, PoliticianAgent, WarlordAgent]
    return [classes[i % len(classes)]() for i in range(count)]


def run_simulation(agent_count: int, seed: int, turns: int | None = None) -> dict[str, Any]:
    if not (5 <= agent_count <= 20):
        raise ValueError("agent_count must be within [5, 20]")

    world_cfg = _load_yaml(CONFIG_DIR / "world.yaml")
    rules_cfg = _load_yaml(CONFIG_DIR / "rules.yaml")
    max_turns = turns if turns is not None else int(world_cfg["max_turns"])

    world = World(
        agents=_build_agents(agent_count),
        rules=rules_cfg,
        max_turns=max_turns,
        seed=seed,
        initial_resource_range=world_cfg["initial_resource_range"],
        strength_range=world_cfg["strength_range"],
    )
    return world.run()


def main() -> None:
    parser = argparse.ArgumentParser(description="Run The Cheater's Dilemma simulation")
    parser.add_argument("--agents", type=int, default=10, help="Number of agents (5-20)")
    parser.add_argument("--seed", type=int, default=42, help="Seed for deterministic runs")
    parser.add_argument("--turns", type=int, default=None, help="Optional override for turn count")
    parser.add_argument("--export-json", action="store_true", help="Export full events/state/summary JSON")
    args = parser.parse_args()

    result = run_simulation(agent_count=args.agents, seed=args.seed, turns=args.turns)
    summary = AnalyticsService.summarize_result(result)

    print("=== Judge Narrative ===")
    for line in summary["judge_lines"]:
        print(line)

    print("=== Leaderboard ===")
    for line in summary["leaderboard_lines"]:
        print(line)

    print("\n=== Metrics ===")
    for key, value in summary["metrics"].items():
        print(f"{key}: {value}")

    if args.export_json:
        out_path = (
            PARENT
            / f"data/simulation_seed{args.seed}_agents{args.agents}_turns{result.get('turns_completed', args.turns)}.json"
        )
        payload = {
            "result": result,
            "summary": summary,
        }
        with out_path.open("w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, sort_keys=True)
        print(f"\nJSON export written: {out_path.name}")


if __name__ == "__main__":
    main()
