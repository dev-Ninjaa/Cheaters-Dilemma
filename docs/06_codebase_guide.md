# 06_codebase_guide.md — Reading the Repo Without Panic

## Purpose
This guide is designed to onboard new developers and researchers to the "Cheater's Dilemma" codebase. It provides a conceptual walkthrough of the repository structure, highlights key components in the backend and frontend, and points to important files and extension points. The goal is to demystify the project and enable quick contributions without requiring a line-by-line code review.

## Contents

### Repository Structure
The project is organized into `backend/` and `frontend/` directories, reflecting its client-server architecture. The `docs/` folder, which you are currently reading, contains all project documentation.

```
.
├── .git/                      # Git version control
├── .gitignore                 # Files and folders to ignore in Git
├── BACKEND_CHANGES_DOCUMENTATION.md # Specific documentation for backend changes
├── backend/                   # Python FastAPI application (Simulation Engine, API)
│   ├── app/                   # Core application logic
│   │   ├── api/               # API routes and schemas
│   │   ├── agents/            # Agent strategy implementations
│   │   ├── config/            # YAML configuration files (rules, world settings)
│   │   ├── core/              # Core utilities, dependencies, rules engine
│   │   ├── domain/            # Game domain models, actions, world state management
│   │   └── services/          # Business logic services (simulation, replay, analytics)
│   ├── .venv/                 # Python virtual environment
│   ├── pyproject.toml         # Poetry dependency management
│   ├── run.py                 # Script to run the backend
│   └── uv.lock                # UV lock file for dependencies
├── cheater-s-dilema-refrence/ # Reference frontend (perhaps an older version or prototype)
├── docs/                      # Project documentation (this folder!)
└── frontend/                  # Next.js React application (User Interface, Visualization)
    ├── public/                # Static assets
    ├── src/                   # Source code
    │   ├── app/               # Next.js page routes (e.g., /agents, /simulation)
    │   ├── components/        # Reusable React components
    │   ├── hooks/             # React custom hooks
    │   └── lib/               # Utility functions, API clients, types
    ├── package.json           # Frontend dependencies
    ├── next.config.ts         # Next.js configuration
    └── tsconfig.json          # TypeScript configuration
```

### Backend Code Walkthrough (Conceptual)
The `backend/` is primarily a Python FastAPI application responsible for running the simulation, managing its state, and exposing an API for the frontend.

#### `backend/app/domain/`
This is arguably the most crucial directory for understanding the game logic. It defines the core "Cheater's Dilemma" concepts:
-   `agent.py`: Defines the `Agent` class and its fundamental properties (resources, reputation, strategy).
-   `world.py`: Encapsulates the overall state of the simulation, including all active agents, resources, and environmental parameters.
-   `actions.py`: Defines the possible actions an agent can take (e.g., `CooperateAction`, `CheatAction`).
-   `resolver.py`: The heart of the game engine, responsible for taking agent actions and determining their outcomes based on game rules.
-   `outcomes.py`: Defines the results of interactions and actions.

#### `backend/app/agents/`
This directory contains the implementations of various agent strategies:
-   `base.py`: The abstract base class or interface that all specific agent strategies must implement. This defines the methods (e.g., `decide_action`) that the simulation engine will call.
-   `cheater.py`, `greedy.py`, `politician.py`, `warlord.py`, `probabilistic.py`: Concrete implementations of different agent types, each with its unique decision-making logic.
    -   **Focus on *why* these files exist**: They allow for diverse behaviors and provide clear extension points for creating new agent types.

#### `backend/app/core/`
Contains fundamental services and configurations used throughout the backend:
-   `config.py`: Handles loading configuration from `backend/app/config/` (e.g., `rules.yaml`, `world.yaml`).
-   `rules.py`: The central rules engine that interprets and applies game rules defined in `rules.yaml`.
-   `governance.py`: Potentially contains logic related to emergent governance mechanisms or alliance management.
-   `rng.py`: Manages the seeded Random Number Generator for reproducible simulations.

#### `backend/app/services/`
Houses higher-level business logic that orchestrates domain models:
-   `simulation_service.py`: Manages the lifecycle of a simulation run (start, stop, advance rounds).
-   `replay_service.py`: Handles storing and retrieving historical simulation data for replays.

#### `backend/app/api/`
Defines the API endpoints that the frontend consumes:
-   `routes/`: Contains FastAPI route definitions for agents, simulations, rules, and replays.
-   `schemas/`: Pydantic models for request and response data validation.

### Frontend Code Overview
The `frontend/` is a Next.js application responsible for the user interface, simulation visualization, and interaction.

#### `frontend/src/app/`
This directory follows Next.js's app router convention for defining pages:
-   `app/page.tsx`: The main landing page.
-   `app/agents/page.tsx`: Lists available agent types.
-   `app/agents/[id]/page.tsx`: Displays details for a specific agent type.
-   `app/simulation/page.tsx`: The primary interface for configuring and running simulations.
-   `app/replays/page.tsx`: Lists past simulation replays.
-   `app/replays/[id]/page.tsx`: Displays a specific replay.

#### `frontend/src/components/`
Contains all reusable React components:
-   `SimulationConfigPanel.tsx`: For setting up simulation parameters.
-   `GameBoard.tsx`, `WorldVisualization.tsx`, `EventVisualization.tsx`: Components for rendering the simulation state and events.
-   `AgentCard.tsx`, `RuleList.tsx`: Components for displaying agent and rule information.
-   `Navigation.tsx`: The main navigation bar.
    -   **Focus on *why* these files exist**: They break down the UI into manageable, reusable pieces, promoting consistency and maintainability.

#### `frontend/src/lib/`
Utility functions and client-side logic:
-   `api.ts`: Client for interacting with the backend API.
-   `types.ts`: Shared TypeScript types for data structures.
-   `utils.ts`: General utility functions.
-   `ws.ts`: WebSocket client for real-time simulation updates.

### Smart Contracts Role
While not explicitly detailed in the provided file structure, if smart contracts were to be integrated, they would likely serve one of two purposes:
1.  **Rule Enforcement:** Hard-coding immutable core rules that cannot be tampered with, ensuring fairness and transparency.
2.  **Resource Ownership/Transfer:** Managing ownership and transfer of critical in-game assets or currency on a decentralized ledger.
The current codebase focuses on a centralized Python backend, but the architecture allows for future integration with blockchain platforms if desired.

### Key Files and Extension Points
-   **New Agent Strategy:** `backend/app/agents/` (create a new `.py` file, inherit from `base.py`).
-   **Modifying Game Rules:** `backend/app/config/rules.yaml` (modify the data), `backend/app/core/rules.py` (modify rule interpretation logic if needed).
-   **Changing World Parameters:** `backend/app/config/world.yaml`.
-   **Adding New API Endpoints:** `backend/app/api/routes/` and `backend/app/api/schemas/`.
-   **Developing New Visualizations:** `frontend/src/components/`.
-   **Adjusting Simulation Flow:** `backend/app/domain/resolver.py` and `backend/app/services/simulation_service.py`.

### Where to Start Hacking
1.  **Understand the Core:** Begin by reviewing `backend/app/domain/agent.py`, `world.py`, and `resolver.py`. These define the fundamental entities and their interactions.
2.  **Explore an Agent:** Pick an existing agent strategy in `backend/app/agents/` (e.g., `cheater.py`) and trace its `decide_action` method to understand how it makes choices.
3.  **Run a Simulation:** Follow the instructions in `07_running_and_deployment.md` to get a local simulation running.
4.  **Experiment with Frontend:** Modify a simple frontend component in `frontend/src/components/` to see how changes are reflected.

This conceptual overview should provide a solid starting point for navigating and contributing to the Cheater's Dilemma codebase. Avoid getting lost in every single file; instead, focus on the purpose of each directory and how the main components interact.
