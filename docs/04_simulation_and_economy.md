# 04_simulation_and_economy.md — Time, Resources, Consequences

## Purpose
This document explains the inner workings of the Cheater's Dilemma simulation engine and the economic system that underpins it. It details how time progresses in the simulation, how agent interactions translate into state changes, and the fundamental resource systems and incentive gradients that drive agent behavior and emergent economic patterns.

## Contents

### Simulation Loop and Rounds
The Cheater's Dilemma operates as an iterative, turn-based simulation structured around a **simulation loop** composed of discrete **rounds**.

1.  **Initialization Phase:** Before the first round, the simulation initializes the world state, places agents with their initial resources and strategies, and sets up environmental parameters (e.g., resource generation rates).
2.  **Per-Round Process:** Each round progresses through a series of well-defined steps:
    *   **Decision Phase:** Each active agent evaluates its current state, its memory of past interactions, and its strategy to determine an action (e.g., cooperate, cheat, initiate alliance, prepare for conflict).
    *   **Interaction Resolution Phase:** The simulation engine collects all proposed actions and resolves conflicts or dependencies. This is where "game mechanics" are applied (e.g., if two agents both chose to "cheat" each other, what is the outcome?).
    *   **State Update Phase:** Based on the resolved interactions, the world state is updated. This includes:
        *   Updating agent resources (gains, losses, costs of actions).
        *   Updating agent reputations and memories.
        *   Modifying alliance structures.
        *   Handling agent elimination or creation (if applicable).
    *   **Environmental Update Phase:** Global parameters might change, or new resources become available.
    *   **Logging & Metrics:** All significant events, state changes, and agent metrics are recorded for later analysis and replay.
3.  **Termination Condition:** The simulation continues for a predefined number of rounds, or until a specific termination condition is met (e.g., all but one agent eliminated, global resources depleted).

### State Transitions
The simulation is a sequence of **state transitions**. Each round transforms the global state of the world from `State_t` to `State_{t+1}`. The global state encompasses:
-   The individual states of all agents (resources, reputation, strategy, alliances).
-   The global resource pool.
-   Environmental parameters.
-   The history of interactions (agent memories).

These transitions are governed by the game's rules and the agents' actions. The deterministic nature of the simulation (given a fixed random seed) ensures that these state transitions are predictable and reproducible.

### Resource Systems
The economic foundation of the Cheater's Dilemma is built upon robust resource systems designed to create meaningful incentives and constraints for agents.
-   **Primary Resource (Currency/Influence):** A fundamental, fungible resource that agents use to perform actions, acquire other resources, or represent their "wealth" or "power." Accumulation of this resource is often a primary objective.
-   **Secondary Resources (e.g., Food, Energy):** Potentially consumable resources necessary for agent "upkeep" or to unlock certain actions. Depletion could lead to starvation or inability to act effectively.
-   **Resource Generation:** Resources can be generated through various mechanisms:
    *   **Passive Income:** A small, consistent inflow per round.
    *   **Action-Based Rewards:** Successful cooperation or exploitation yielding resources.
    *   **Environmental Sources:** Accessing specific locations or opportunities in the world.
-   **Resource Consumption:** Agents consume resources for:
    *   **Upkeep:** A fixed cost per round to remain active.
    *   **Actions:** Specific actions (e.g., initiating violence, forming an alliance) may have a resource cost.
    *   **Trade/Transfer:** Exchanging resources with other agents.

### Incentive Gradients
The design of resource systems and interaction outcomes creates **incentive gradients** – the subtle and overt forces that push agents towards certain behaviors.
-   **Short-term vs. Long-term Payoff:** Cheating might offer a large immediate payoff, but cooperation often yields more sustainable, long-term benefits, especially in iterated games with memory.
-   **Risk vs. Reward:** High-risk actions (like aggressive betrayal or violence) might offer significant rewards if successful, but catastrophic losses if they fail.
-   **Opportunity Cost:** Choosing one action means foregoing another, and the economic model ensures agents constantly weigh these opportunity costs.
These gradients are critical for shaping the emergent strategies and social structures observed in the simulation.

### Short-term vs. Long-term Payoff
A central theme is the tension between short-term gains and long-term consequences.
-   **Short-term:** Immediate resource acquisition through direct exploitation or opportunistic betrayal. This can lead to rapid growth but also quick retaliation or isolation.
-   **Long-term:** Sustainable resource growth through consistent cooperation, alliance building, and reputation management. This often requires patience and forbearance but can lead to more stable and powerful positions.
The balance between these two types of payoffs is crucial for understanding the stability and dynamics of the simulated society.

### Emergent Economic Behavior
From these simple resource rules and agent incentives, complex **emergent economic behaviors** are expected, such as:
-   **Market Formation:** Agents might implicitly or explicitly trade resources.
-   **Wealth Disparity:** Unequal distribution of resources leading to rich and poor agents.
-   **Resource Monopolies:** Dominant agents or alliances controlling vital resource generation.
-   **Boom-Bust Cycles:** Periods of rapid resource accumulation followed by crashes, influenced by collective agent behavior.
-   **Informal Currencies:** Reputation or trust becoming a form of social capital that can be "spent" or "earned."

### Metrics Tracked During Runs
To facilitate detailed analysis, the simulation tracks a wide array of metrics, including:
-   **Agent-level Metrics:**
    *   Current resources.
    *   Reputation scores with other agents.
    *   Number of cooperations/defections.
    *   Alliance membership history.
    *   Survival duration.
    *   Actions taken per round.
-   **Global Metrics:**
    *   Total resources in the system.
    *   Average agent resources.
    *   Number of active agents.
    *   Number of alliances and their stability.
    *   Overall cooperation rate vs. defection rate.
    *   Major events (e.g., large-scale betrayals, violent conflicts).
These metrics provide the data necessary for researchers to quantify and understand the complex dynamics generated by the simulation.
