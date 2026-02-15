#!/usr/bin/env python3
"""
Demo with New Features - The Cheater's Dilemma

This demo showcases the new features:
- Health system (50 HP, REST heals +10)
- Alliance formation and breaking
- Coalition attacks
- Trading between agents
- Movement/positioning
- Human-readable event narratives
"""

import json
import sys
from pathlib import Path

BACKEND_PATH = Path(__file__).parent
sys.path.insert(0, str(BACKEND_PATH))

from app.services.simulation_service import SimulationService
from app.services.event_narrator import EventNarrator
from app.domain.world import World
from app.agents.greedy import GreedyAgent
from app.agents.cheater import CheaterAgent
from app.agents.politician import PoliticianAgent
from app.agents.warlord import WarlordAgent
import yaml


def run_simulation_with_new_features():
    """Run simulation with new features enabled."""
    print("="*80)
    print("THE CHEATER'S DILEMMA - WITH NEW FEATURES")
    print("="*80)
    print()
    print("New Features Enabled:")
    print("  ✅ Health System (50 HP, REST heals +10)")
    print("  ✅ Alliance Formation & Breaking")
    print("  ✅ Coalition Attacks")
    print("  ✅ Trading Between Agents")
    print("  ✅ Movement/Positioning")
    print("  ✅ Human-Readable Event Narratives")
    print()
    
    # Load configurations
    config_dir = BACKEND_PATH / "app" / "config"
    world_cfg = yaml.safe_load(open(config_dir / "world.yaml"))
    rules_cfg = yaml.safe_load(open(config_dir / "rules.yaml"))
    
    print("🔧 Initializing simulation...")
    print(f"   - Seed: 42")
    print(f"   - Agents: 6")
    print(f"   - Max Turns: 100")
    print(f"   - Initial Health: 50 HP")
    print()
    
    # Create agents
    agents = [
        GreedyAgent(),
        CheaterAgent(),
        PoliticianAgent(),
        WarlordAgent(),
        GreedyAgent(),
        CheaterAgent(),
    ]
    
    # Create world with new features enabled
    world = World(
        agents=agents,
        rules=rules_cfg,
        max_turns=100,
        seed=42,
        initial_resource_range=world_cfg['initial_resource_range'],
        strength_range=world_cfg['strength_range'],
        enable_new_features=True  # Enable new features!
    )
    
    print("🎮 Running simulation...")
    result = world.run()
    
    print()
    print("="*80)
    print("SIMULATION COMPLETE")
    print("="*80)
    print()
    
    # Print human-readable narrative (first 50 events)
    events = result.get("events", [])
    EventNarrator.print_narrative(events, max_events=50)
    
    # Print summary statistics
    EventNarrator.print_summary(events)
    
    # Print final leaderboard
    print()
    print("="*80)
    print("FINAL LEADERBOARD")
    print("="*80)
    leaderboard = result.get("leaderboard", [])
    for i, agent in enumerate(leaderboard, 1):
        status = "✅ ALIVE" if agent["alive"] else "💀 ELIMINATED"
        print(f"{i}. Agent {agent['agent_id']} ({agent['strategy']:<10}): "
              f"{agent['resources']:>4} tokens | "
              f"Strength: {agent['strength']:>2} | "
              f"{status}")
    
    print()
    print("="*80)
    print("METRICS")
    print("="*80)
    print(f"Turns Completed: {result['turns_completed']}")
    print(f"Alive Agents: {len(result['alive'])}/{len(leaderboard)}")
    print(f"Total Events: {result['event_count']}")
    print(f"Rules Version: {result['rules_version']}")
    
    # Save results
    results_file = "data/simulation_with_new_features_seed42.json"
    with open(results_file, 'w') as f:
        json.dump(result, f, indent=2)
    print(f"\n💾 Results saved to: {results_file}")
    
    return result


def main():
    """Main function."""
    print("\n🚀 Starting The Cheater's Dilemma with New Features...\n")
    
    result = run_simulation_with_new_features()
    
    print("\n✅ Demo complete!")
    print("\nNote: This simulation includes new features:")
    print("  - Health system with REST action")
    print("  - Alliance formation and coalition attacks")
    print("  - Trading between agents")
    print("  - Movement/positioning")
    print("\nAll features are backward compatible.")
    print("Run demo_flow.py for the original simulation without new features.")


if __name__ == "__main__":
    main()
