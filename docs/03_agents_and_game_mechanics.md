# 03_agents_and_game_mechanics.md — Who Acts and What They Can Do

## Purpose
This document details the core actors within the Cheater's Dilemma simulation – the agents – and the fundamental game mechanics that govern their interactions. It explains what an agent is, their lifecycle, strategy abstraction, decision-making processes, and the various interaction types that drive the simulation forward. This is where the abstract game theory becomes concrete rules and actions.

## Contents

### What an Agent Is
In the Cheater's Dilemma, an **agent** is an autonomous entity that embodies a specific strategy within the simulated environment. Each agent possesses:
-   **An Identity:** A unique identifier within the simulation.
-   **Internal State:** Resources (e.g., currency, influence), reputation, memory of past interactions, and potentially current alliances.
-   **A Strategy:** A set of rules or an algorithm that dictates its decision-making process. This strategy determines how the agent will act in various situations, especially when faced with dilemmas.
-   **Actions:** The capability to perform a defined set of actions within the game world (e.g., cooperate, cheat, propose alliance, attack).

Agents are the primary drivers of emergent behavior, and their diverse strategies are central to the simulation's complexity.

### Agent Lifecycle
An agent's journey through the simulation typically involves several stages:
1.  **Initialization:** Agents are created with initial resources, an assigned strategy, and an empty memory of interactions.
2.  **Interaction Rounds:** In each simulation round, agents engage with others based on proximity, predefined rules, or emergent social structures. They make decisions according to their strategy and update their internal state based on the outcomes.
3.  **State Update:** After interactions are resolved by the simulation engine, agents' resources, reputation, and memory are updated.
4.  **Alliance Management:** Agents may form, maintain, or break alliances based on strategic considerations and trust levels.
5.  **Survival/Elimination:** Agents strive to survive and accumulate resources. Failure to do so (e.g., running out of resources, being "eliminated" through conflict) leads to their removal from the active simulation.
6.  **Observation:** Their behavior is recorded and contributes to the overall simulation data for analysis.

### Strategy Abstraction
Agent strategies are abstracted to allow for modularity and experimentation. Each agent type (`cheater.py`, `greedy.py`, `politician.py`, `warlord.py`, `probabilistic.py`, `base.py`) inherits from a common base interface (`base.py` under `app/agents/`), ensuring that all agents can respond to the same set of environmental cues and propose actions. This abstraction allows researchers to:
-   **Easily define new strategies:** By implementing the required interface methods.
-   **Compare different strategies:** By running simulations with varied agent populations.
-   **Analyze strategy effectiveness:** Under different game parameters and environmental conditions.
Strategies can range from simple rule-based behaviors (e.g., "always cheat") to more complex, adaptive algorithms that learn from past experiences.

### Decision-Making Loop
In each relevant phase of a simulation round, an agent goes through a decision-making loop:
1.  **Perception:** The agent receives information about its current state and the state of relevant other agents (e.g., who it is interacting with, their known reputation, its own resources).
2.  **Strategy Application:** The agent applies its inherent strategy logic to this perceived information.
3.  **Action Selection:** Based on its strategy, the agent selects an action from the set of available actions (e.g., cooperate, defect, propose alliance, attack).
4.  **Action Submission:** The chosen action is submitted to the central simulation engine for resolution.

### Interaction Types
The simulation supports a rich set of interaction types, allowing for complex social dynamics:

#### Cooperation
-   **Definition:** Agents choose to act in a way that benefits both parties, potentially at a short-term cost to themselves, or for a long-term mutual gain.
-   **Mechanics:** Often involves resource sharing, mutual defense, or abstaining from cheating when an opportunity arises. This is the positive-sum aspect of interactions.

#### Cheating
-   **Definition:** Agents choose to act purely in their self-interest, often at the expense of another agent, to gain an immediate advantage.
-   **Mechanics:** Can involve stealing resources, breaking promises, or exploiting vulnerabilities. Cheating provides short-term gains but can incur long-term costs (e.g., reputation loss, retaliation).

#### Alliances
-   **Definition:** Groups of agents formally or informally agree to mutual support, defense, or resource sharing.
-   **Mechanics:** Alliances can be fluid, formed and broken based on changing strategic needs. They can provide collective strength, but also introduce the dilemma of free-riding or internal betrayal. They act as emergent institutions.

#### Violence
-   **Definition:** Direct conflict between agents, aiming to eliminate an opponent or confiscate their resources.
-   **Mechanics:** This is a high-stakes interaction. It might be triggered by extreme resource scarcity, long-standing betrayal, or an agent's inherent "warlord" strategy. Success in violence often leads to resource transfer or elimination of the losing agent.

### Strength, Survival, and Elimination
-   **Strength:** An agent's strength is often a function of its accumulated resources, reputation, and alliance support. Stronger agents have more leverage and better chances of survival.
-   **Survival:** The primary objective for most agents is to survive. This means maintaining sufficient resources and avoiding elimination.
-   **Elimination:** Agents can be eliminated from the simulation if their resources drop below a critical threshold, or if they are successfully targeted in an act of violence. Elimination events are crucial for understanding systemic stability and the consequences of strategic choices.

### Win / Loss Ambiguity
A key design principle is the deliberate ambiguity of "winning" or "losing." There isn't a single, universally defined victory condition for individual agents. Instead, success is measured by:
-   **Survival Duration:** How long an agent persists in the simulation.
-   **Resource Accumulation:** The total wealth or influence an agent gathers.
-   **Alliance Dominance:** The power and stability of the alliances an agent belongs to.
-   **Strategic Goals:** Whether an agent successfully executed its inherent strategy (e.g., a "cheater" might "win" by successfully exploiting others, even if eventually eliminated).
This ambiguity encourages researchers to define their own metrics for success, leading to richer interpretations of simulation outcomes and emergent behaviors. The focus is on the dynamics and patterns, not just a binary outcome.
