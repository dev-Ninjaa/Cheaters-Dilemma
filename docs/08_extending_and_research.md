# 08_extending_and_research.md — How This Grows

## Purpose
This document invites contribution and exploration by outlining various ways the Cheater's Dilemma simulation can be extended, modified, and used for research. It provides guidance for developers looking to add new features, researchers seeking to pose new questions, and educators wanting to use the system for experimental learning.

## Contents

### Adding New Strategies
The most straightforward way to extend the Cheater's Dilemma is by introducing novel agent strategies. This is crucial for exploring a wider range of behaviors and observing their impact on the simulated society.

1.  **Understand the `BaseAgent` Interface:** All custom agents must inherit from the `BaseAgent` class (found in `backend/app/agents/base.py`). This interface defines the core methods that the simulation engine expects from an agent, such as `decide_action()`, which is called each round to determine the agent's move.
2.  **Create a New Agent File:** In the `backend/app/agents/` directory, create a new Python file (e.g., `altruist.py`).
3.  **Implement `BaseAgent`:**
    *   Define a new class that inherits from `BaseAgent`.
    *   Implement the `decide_action(self, current_world_state: World, agent_id: str) -> Action:` method. This method will contain your agent's unique logic.
    *   Your agent's logic should analyze the `current_world_state` (e.g., other agents' reputations, available resources) and return an appropriate `Action` (e.g., `CooperateAction`, `CheatAction`, `ProposeAllianceAction`).
4.  **Register the New Agent:** Ensure your new agent strategy is discoverable by the simulation. This usually involves adding it to a registry or configuration that the `simulation_service` uses to instantiate agents. Refer to `backend/app/core/config.py` and `backend/app/services/simulation_service.py` to see how existing agents are loaded.
5.  **Test and Observe:** Run simulations with your new agent type alongside existing ones to observe its behavior and impact.

### Modifying Mechanics
The core game mechanics can be altered to explore different underlying assumptions or to introduce new complexities.

1.  **Adjusting Rules:**
    *   **Edit `rules.yaml` (`backend/app/config/rules.yaml`):** This YAML file defines many configurable aspects of the game, such as resource generation rates, costs of actions, or reputation decay rates. Modifying these values can drastically change simulation dynamics.
    *   **Modify `rules.py` (`backend/app/core/rules.py`):** For more complex rule changes that cannot be expressed purely through configuration, you might need to modify the Python logic that interprets and applies these rules.
2.  **Introducing New Interactions:**
    *   This would involve defining new `Action` types in `backend/app/domain/actions.py`.
    *   Implementing the logic for resolving these new interactions in `backend/app/domain/resolver.py`.
    *   Potentially updating agent strategies to be able to choose these new actions.
3.  **Altering Resource Systems:**
    *   Changes to how resources are generated, consumed, or transferred would primarily involve `backend/app/domain/world.py` and potentially the `resolver.py`.

### Plugging in AI Agents
The abstracted agent interface makes it possible to integrate more advanced AI models, beyond simple rule-based strategies.

-   **Machine Learning-driven Agents:** Replace the `decide_action` logic with an agent that uses reinforcement learning, neural networks, or other AI techniques to learn optimal strategies based on simulation feedback. This would require integrating an ML framework (e.g., TensorFlow, PyTorch) and managing training data/models.
-   **Large Language Model (LLM) Agents:** While computationally intensive, an LLM could interpret the `current_world_state` and generate text-based "actions," which would then need to be parsed and translated into `Action` objects recognizable by the simulation engine. This opens avenues for more nuanced, human-like strategic thinking.

### Running Large Experiments
For serious research, running numerous simulations with varying parameters is essential.

-   **Parameter Sweeps:** Develop scripts to automatically run the simulation multiple times, systematically varying initial conditions, agent populations, or rule parameters.
-   **Distributed Simulations:** For very large-scale experiments, consider distributing simulation runs across multiple machines or using cloud computing resources.
-   **Data Analysis Tools:** Utilize data analysis libraries (e.g., Pandas, NumPy, SciPy in Python) and visualization tools (e.g., Matplotlib, Seaborn) to process and interpret the vast amounts of data generated. The `backend/app/services/analytics_service.py` could be expanded for this purpose.

### Research Questions This System Enables
The Cheater's Dilemma is a versatile platform for exploring a wide array of research questions:
-   **Evolution of Cooperation:** Under what conditions do cooperative strategies prevail over purely selfish ones? How resilient is cooperation to external shocks or influxes of cheaters?
-   **Emergence of Governance:** How do decentralized systems develop norms, rules, and power structures without central authority? What factors lead to stability versus collapse?
-   **Impact of Memory and Reputation:** How do different memory durations or reputation mechanisms alter strategic behavior and systemic outcomes?
-   **Alliance Dynamics:** What drives the formation, stability, and dissolution of alliances? How do alliances affect the balance of power?
-   **Economic Inequality:** How does the game's economic system lead to wealth disparities, and what are the consequences for system stability?
-   **Adaptation to Adversity:** How do agents and the system as a whole adapt to changing environmental conditions or the introduction of aggressive new strategies?
-   **AI Ethics and Behavior:** How do advanced AI agents interact in complex social dilemmas? Can we design AI that fosters cooperation?

### Educational and Experimental Use Cases
Beyond pure research, the Cheater's Dilemma serves as an excellent educational tool:
-   **Interactive Game Theory Demonstrations:** Visually demonstrate abstract game theory concepts (e.g., Prisoner's Dilemma, Tit-for-Tat) in a dynamic environment.
-   **Complex Systems Pedagogy:** Teach principles of emergent behavior, self-organization, and feedback loops in complex adaptive systems.
-   **Programming Practice:** Provides a clear project for students to implement new agent strategies, visualize data, or extend the backend.
-   **Policy Experimentation (Analogous):** While not a predictive tool for real-world policy, it can be used to explore analogous scenarios and gain intuition about the potential impacts of different incentive structures or rule changes in decentralized systems.
The interactive frontend and accessible codebase make it suitable for hands-on learning and exploration.
