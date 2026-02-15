# 00_overview.md — The Map

## Purpose
This document serves as an orientation guide to the "Cheater's Dilemma" project. It's designed to provide a high-level understanding of what the project entails, the problem it addresses, its core components, and how to effectively navigate the accompanying documentation. This is about providing a practical overview, not delving into deep philosophical discussions.

## Contents

### What Cheater’s Dilemma Is
The Cheater's Dilemma is a sophisticated simulation platform designed to explore complex social and economic dynamics through iterated game theory. It models a world where autonomous agents interact, making decisions about cooperation, betrayal, resource management, and governance. The core aim is to observe emergent behaviors, alliances, conflicts, and the evolution of social structures without predefined moral directives. It's a living laboratory for understanding decentralized systems and the challenges of collective action.

### What Problem It Explores
This project primarily explores the fundamental tension between individual self-interest and collective well-being, particularly in scenarios involving repeated interactions and imperfect information. It investigates:
- How cooperation and cheating evolve in dynamic environments.
- The impact of various game mechanics (e.g., memory, reputation, resource scarcity) on agent strategies.
- The spontaneous emergence of governance, power structures, and conflict resolution mechanisms.
- The robustness and fragility of emergent social orders in the face of betrayal and resource competition.

### High-Level Components
The Cheater's Dilemma system comprises several key components working in concert:
1.  **Autonomous Agents:** Entities with defined strategies (e.g., cheaters, cooperators, politicians, warlords) that make decisions based on their internal logic, memory of past interactions, and current environmental state.
2.  **Simulation Engine:** The core orchestrator that manages rounds, agent interactions, state transitions, and resource allocation.
3.  **Economic System:** Defines resource generation, consumption, and exchange, creating incentive structures and opportunities for accumulation or loss.
4.  **Governance & Conflict Mechanics:** Rules and emergent behaviors that dictate how agents form alliances, wield power, resolve disputes, and engage in "violence" (strategic elimination or resource confiscation).
5.  **Backend API:** Provides the interface for running simulations, managing agents, and retrieving simulation data.
6.  **Frontend Visualization:** A user interface that renders the simulation in real-time or replays past events, offering insights into agent behavior and emergent patterns.

### What This Project Is Not
While related to various fields, it's important to clarify what Cheater's Dilemma is *not*:
-   **A prescriptive moral guide:** It does not dictate "good" or "bad" behavior, but rather observes the consequences of various strategies.
-   **A predictive model for real-world events:** While drawing inspiration from social science, it's an abstract simulation, not a direct forecast tool for human societies.
-   **A simple game theory experiment:** It goes beyond basic Prisoner's Dilemma scenarios by introducing complex emergent properties, multi-agent interactions, and dynamic environments.
-   **A traditional video game:** Its primary purpose is research and exploration, not entertainment (though it can be engaging).

### How to Read the Docs
This documentation is structured hierarchically to guide you from a broad overview to specific details:
-   **Start with this `00_overview.md`** for fundamental context.
-   Proceed to `01_vision_and_theory.md` for the underlying intellectual framework.
-   `02_system_architecture.md` provides a technical blueprint.
-   Subsequent documents (`03` through `05`) dive into specific mechanics like agents, simulation, and governance.
-   `06_codebase_guide.md` is crucial for developers looking to contribute.
-   `07_running_and_deployment.md` offers practical setup instructions.
-   Finally, `08_extending_and_research.md` and `09_limitations_and_roadmap.md` outline future possibilities and current boundaries.
Feel free to jump to sections relevant to your immediate interest after grasping the overview, but a linear read is recommended for a comprehensive understanding.

### Who This Is For (Builders, Researchers, Curious Minds)
This project welcomes a diverse audience:
-   **Builders/Developers:** Those interested in contributing to the codebase, extending agent behaviors, or developing new simulation mechanics. The `06_codebase_guide.md` and `07_running_and_deployment.md` files will be your primary resources.
-   **Researchers/Academics:** Individuals studying game theory, complex systems, emergent behavior, artificial intelligence, or social simulations. The theoretical documents and extension guides will be most relevant.
-   **Curious Minds:** Anyone fascinated by the dynamics of cooperation, conflict, and the emergence of order in decentralized systems. You can engage with the conceptual documents and explore the visualizations.