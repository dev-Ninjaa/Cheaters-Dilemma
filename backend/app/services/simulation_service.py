from typing import Any, Dict, Optional

# Import agents directly to avoid circular import issues
from ..agents.cheater import CheaterAgent
from ..agents.greedy import GreedyAgent
from ..agents.politician import PoliticianAgent
from ..agents.warlord import WarlordAgent
from ..domain.world import World
from .metrics_service import MetricsService


class SimulationService:
    """Service layer for managing simulations"""

    def __init__(self):
        pass

    def create_world(
        self,
        agent_count: int,
        seed: int,
        turns: Optional[int] = None
    ) -> World:
        """Create a world without running the simulation"""
        if not (5 <= agent_count <= 20):
            raise ValueError("agent_count must be within [5, 20]")

        # Build agents
        agents = self._build_agents(agent_count)

        # Load configs
        import yaml
        import os
        config_dir = os.path.join(os.path.dirname(__file__), "..", "config")

        with open(os.path.join(config_dir, "world.yaml"), "r") as f:
            world_cfg = yaml.safe_load(f)

        with open(os.path.join(config_dir, "rules.yaml"), "r") as f:
            rules_cfg = yaml.safe_load(f)

        max_turns = turns if turns is not None else int(world_cfg["max_turns"])

        # Create world
        world = World(
            agents=agents,
            rules=rules_cfg,
            max_turns=max_turns,
            seed=seed,
            initial_resource_range=world_cfg["initial_resource_range"],
            strength_range=world_cfg["strength_range"],
            enable_new_features=True,  # Enable health system
        )

        return world

    def start_simulation(
        self,
        agent_count: int,
        seed: int,
        turns: Optional[int] = None
    ) -> Dict[str, Any]:
        """Start a new simulation and return initial state"""
        world = self.create_world(agent_count, seed, turns)
        snapshot = world.snapshot()
        # Add metrics to the snapshot
        snapshot["metrics"] = self._calculate_metrics(snapshot)
        return snapshot

    def _calculate_metrics(self, snapshot: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate metrics from snapshot data"""
        try:
            leaderboard = snapshot.get("leaderboard", [])
            
            # Extract resource values from leaderboard
            resources = [agent.get("resources", 0) for agent in leaderboard]
            strengths = [agent.get("strength", 0) for agent in leaderboard]
            
            # Calculate governance level (simplified - based on rule usage)
            action_counts = snapshot.get("action_counts", {})
            total_actions = sum(action_counts.values())
            governance_actions = action_counts.get("VOTE", 0) + action_counts.get("REPORT", 0)
            governance_level = governance_actions / max(total_actions, 1) if total_actions > 0 else 0.0
            
            # Ensure we have valid data
            avg_strength = sum(strengths) / len(strengths) if strengths else 0.0
            avg_resources = sum(resources) / len(resources) if resources else 0.0
            
            return {
                "gini_resources": MetricsService.calculate_gini(resources),
                "hhi_resources": MetricsService.calculate_hhi(resources),
                "avg_strength": round(avg_strength, 2),
                "avg_resources": round(avg_resources, 2),
                "governance_level": round(governance_level, 3)
            }
        except Exception as e:
            # Return default metrics if calculation fails
            return {
                "gini_resources": 0.0,
                "hhi_resources": 0.0,
                "avg_strength": 0.0,
                "avg_resources": 0.0,
                "governance_level": 0.0
            }

    def _build_agents(self, count: int):
        """Build the roster of agents"""
        classes = [GreedyAgent, CheaterAgent, PoliticianAgent, WarlordAgent]
        return [classes[i % len(classes)]() for i in range(count)]