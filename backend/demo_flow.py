#!/usr/bin/env python3
"""
Demo flow for The Cheater's Dilemma with Agent + Token Integration

This script demonstrates the complete flow:
1. Run the simulation with token-based economics
2. Generate the final token distribution
3. Show the summary results
4. Demonstrate the on-chain deployment concept

Author: Senior Backend + Smart Contract Engineer
Date: 2024
"""

import json
import sys
from pathlib import Path
from typing import Any, Dict

# Add backend to path
BACKEND_PATH = Path(__file__).parent
sys.path.insert(0, str(BACKEND_PATH))

from app.services.simulation_service import SimulationService
from app.services.analytics_service import AnalyticsService
from app.domain.world import World
import yaml


def run_demo_simulation():
    """Run the complete demo simulation and show results."""
    print("="*60)
    print("THE CHEATER'S DILEMMA - AGENT + TOKEN INTEGRATION DEMO")
    print("="*60)
    
    # Load configurations
    config_dir = BACKEND_PATH / "app" / "config"
    world_cfg = yaml.safe_load(open(config_dir / "world.yaml"))
    rules_cfg = yaml.safe_load(open(config_dir / "rules.yaml"))
    
    print("🔧 Initializing deterministic simulation...")
    print(f"   - Seed: 42")
    print(f"   - Agents: 8")
    print(f"   - Max Turns: {world_cfg['max_turns']}")
    print(f"   - Initial Token Range: {world_cfg['initial_resource_range']}")
    
    # Create simulation service and world
    service = SimulationService()
    world = service.create_world(
        agent_count=8,
        seed=42,
        turns=200  # Shorter for demo
    )
    
    print("\n🎮 Running simulation...")
    result = world.run()
    
    print("\n📊 GENERATING SIMULATION SUMMARY")
    print("-" * 40)
    summary = AnalyticsService.summarize_result(result)
    
    # Print judge narrative
    print("📋 JUDGE NARRATIVE:")
    for line in summary["judge_lines"]:
        print(f"   {line}")
    
    print("\n🏆 LEADERBOARD:")
    for line in summary["leaderboard_lines"]:
        print(f"   {line}")
    
    print("\n📈 FINAL METRICS:")
    metrics = summary["metrics"]
    print(f"   - Winner: Agent {metrics['winner_analysis']['winner_id']} ({metrics['winner_analysis']['winner_strategy']})")
    print(f"   - Final Gini Coefficient: {metrics['gini_token_balance']:.5f}")
    print(f"   - Governance Capture: {metrics['governance_capture']['accepted_rules_by_top2_percent']:.1f}%")
    print(f"   - Alive Agents: {metrics['alive_count']}/{len(result['leaderboard'])}")
    print(f"   - Total Events: {metrics['event_count']}")
    
    print("\n💰 TOKEN BALANCE DISTRIBUTION:")
    for agent in result["leaderboard"]:
        status = "alive" if agent["alive"] else "eliminated"
        print(f"   Agent {agent['agent_id']:>2} ({agent['strategy']:<10}): {agent['resources']:>4} tokens ({status})")
    
    # Save results
    results_file = f"data/simulation_results_demo_seed42.json"
    with open(results_file, 'w') as f:
        json.dump({"result": result, "summary": summary}, f, indent=2)
    
    print(f"\n💾 Results saved to: {results_file}")
    
    return result, summary


def show_governance_logic():
    """Show how governance works with token-weighted voting."""
    print("\n🏛️  GOVERNANCE SYSTEM WITH TOKEN-WEIGHTED VOTING")
    print("-" * 50)
    print("✅ Voting weight = Token Balance (not one-agent-one-vote)")
    print("✅ Proposal passes if YES votes > 50% of total token supply")
    print("✅ Agents with more tokens have more governance influence")
    print("✅ Strategic voting based on token holdings")
    print("✅ Corruption threshold affects governance participation")


def show_utility_computation():
    """Show how agents use utility-based decision making."""
    print("\n🧠 UTILITY-BASED AGENT DECISION MAKING")
    print("-" * 40)
    print("Utility(action) =")
    print("    α × expected_token_gain")
    print("  - β × retaliation_risk") 
    print("  + γ × governance_influence_gain")
    print("  - δ × reputation_loss")
    print("")
    print("Each agent has internal coefficients:")
    print("  - risk_tolerance: How willing to take risks")
    print("  - aggression: How likely to attack/steal")
    print("  - governance_bias: How much to participate in governance")
    print("  - corruption_threshold: When to engage in corrupt behavior")


def show_determinism():
    """Show that the simulation is deterministic."""
    print("\n🎲 DETERMINISM GUARANTEED")
    print("-" * 25)
    print("✅ Same seed = Same results every time")
    print("✅ Deterministic RNG for probabilistic elements")
    print("✅ No external API calls or async operations")
    print("✅ Pure Python simulation engine")
    print("✅ Reproducible results for verification")


def show_smart_contract_integration():
    """Show the smart contract integration."""
    print("\n🔗 ON-CHAIN TOKEN INTEGRATION")
    print("-" * 35)
    print("Token: DILEMMA (DLM)")
    print("Network: Monad Testnet")
    print("Features:")
    print("  - ERC20 compliant")
    print("  - Immutable distribution based on simulation")
    print("  - Simulation hash stored in contract")
    print("  - No transfer functionality (distribution locked)")
    print("  - Mintable only at deployment")
    print("  - No upgradeability")


def show_demo_summary():
    """Show the complete demo summary."""
    print("\n" + "="*60)
    print("🏁 DEMO FLOW COMPLETE - SUMMARY")
    print("="*60)
    print("✅ Autonomous AI agents competing")
    print("✅ Governance capture through token accumulation") 
    print("✅ Institutional corruption emerging naturally")
    print("✅ Deterministic replay capability")
    print("✅ On-chain encoding of final political power distribution")
    print("✅ Clean separation of concerns:")
    print("    - Simulation Engine: Pure deterministic Python")
    print("    - Blockchain Layer: Post-simulation deployment only")
    print("    - API: Read-only interaction")
    print("="*60)


def main():
    """Main demo function."""
    print("🚀 Starting The Cheater's Dilemma - Agent + Token Demo...")
    
    # Run the simulation
    result, summary = run_demo_simulation()
    
    # Show governance logic
    show_governance_logic()
    
    # Show utility computation
    show_utility_computation()
    
    # Show determinism
    show_determinism()
    
    # Show smart contract integration
    show_smart_contract_integration()
    
    # Show summary
    show_demo_summary()
    
    print(f"\n🎯 Final Winner: Agent {summary['metrics']['winner_analysis']['winner_id']} "
          f"with {result['leaderboard'][0]['resources']} tokens")
    print(f"🏆 Winner Strategy: {summary['metrics']['winner_analysis']['winner_strategy']}")
    print(f"📊 Final Gini Coefficient: {summary['metrics']['gini_token_balance']:.5f}")
    print(f"🗳️  Governance Capture: {summary['metrics']['governance_capture']['accepted_rules_by_top2_percent']:.1f}%")


if __name__ == "__main__":
    main()