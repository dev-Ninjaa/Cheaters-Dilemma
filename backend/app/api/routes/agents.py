from typing import List
from fastapi import APIRouter, HTTPException

from ..schemas.agents import AgentSummary, AgentDetail

router = APIRouter()


@router.get("/", response_model=List[AgentSummary])
async def get_agents(simulation_id: str) -> List[AgentSummary]:
    """Get all agents in a simulation"""
    # For now, return mock data - in real implementation, get from simulation service
    return [
        AgentSummary(
            agent_id=0,
            strategy="greedy",
            resources=45,
            strength=8,
            alive=True,
            trust=0.7,
            aggression=0.2,
            rank=1
        ),
        AgentSummary(
            agent_id=1,
            strategy="cheater",
            resources=32,
            strength=6,
            alive=True,
            trust=0.3,
            aggression=0.8,
            rank=2
        ),
        AgentSummary(
            agent_id=2,
            strategy="warlord",
            resources=28,
            strength=9,
            alive=True,
            trust=0.1,
            aggression=0.9,
            rank=3
        ),
        AgentSummary(
            agent_id=3,
            strategy="politician",
            resources=22,
            strength=5,
            alive=True,
            trust=0.6,
            aggression=0.4,
            rank=4
        ),
        AgentSummary(
            agent_id=4,
            strategy="probabilistic",
            resources=18,
            strength=7,
            alive=True,
            trust=0.5,
            aggression=0.6,
            rank=5
        )
    ]


@router.get("/{agent_id}", response_model=AgentDetail)
async def get_agent_detail(agent_id: int, simulation_id: str) -> AgentDetail:
    """Get detailed information about a specific agent"""
    # Mock data - in real implementation, get from simulation service
    return AgentDetail(
        agent_id=agent_id,
        strategy="greedy",
        resources=45,
        strength=8,
        alive=True,
        trust=0.7,
        aggression=0.2,
        rank=1,
        total_actions=25,
        successful_actions=18,
        failed_actions=7,
        reputation_history=[0.5, 0.6, 0.7],
        resource_history=[10, 25, 45]
    )