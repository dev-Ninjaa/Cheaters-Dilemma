# 07_running_and_deployment.md — From Repo to Running System

## Purpose
This document serves as a practical guide for setting up, running, and deploying the Cheater's Dilemma system. It provides instructions for local development, executing simulations, and understanding potential deployment options and common issues.

## Contents

### Local Setup

To get the Cheater's Dilemma running on your local machine, you'll need Python (for the backend) and Node.js/npm (for the frontend). This guide assumes you have `git` installed for cloning the repository.

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-repo/cheaters-dilemma.git
    cd cheaters-dilemma
    ```
    (Note: Replace `https://github.com/your-repo/cheaters-dilemma.git` with the actual repository URL.)

2.  **Backend Setup (Python):**
    The backend uses Poetry for dependency management.
    *   **Install Poetry:**
        ```bash
        pip install poetry
        ```
    *   **Navigate to the backend directory:**
        ```bash
        cd backend
        ```
    *   **Install Dependencies:**
        ```bash
        poetry install
        ```
    *   **Activate Virtual Environment (optional, Poetry handles this implicitly):**
        ```bash
        poetry shell
        ```
    *   **Database Setup:**
        The backend currently implies a database. If using a local SQLite file for development, it might be automatically created. For PostgreSQL or other databases, ensure you have the server running and connection details configured (often via environment variables or a `.env` file). Refer to `backend/app/infra/db.py` for database connection logic.

3.  **Frontend Setup (Next.js):**
    The frontend uses npm (or bun/yarn).
    *   **Navigate to the frontend directory:**
        ```bash
        cd ../frontend # Assuming you are in 'backend' directory
        ```
    *   **Install Dependencies:**
        ```bash
        npm install
        # or `bun install` if you prefer Bun
        ```

### Running Simulations

#### Running the Backend Server

The backend provides the API and runs the simulation engine.

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
2.  **Start the FastAPI server:**
    ```bash
    poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    ```
    *   `--reload`: Automatically reloads the server on code changes (useful for development).
    *   `--host 0.0.0.0`: Makes the server accessible from outside `localhost` (if needed for containerization or specific network setups).
    *   `--port 8000`: Runs the server on port 8000.

    You should see output indicating that the FastAPI application is running. The API documentation (Swagger UI) will typically be available at `http://localhost:8000/docs`.

#### Running the Frontend

The frontend provides the user interface to interact with the backend.

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```
2.  **Start the Next.js development server:**
    ```bash
    npm run dev
    # or `bun dev`
    ```
    The frontend application will typically be available at `http://localhost:3000`. Ensure the frontend can connect to the backend (check `frontend/src/lib/api.ts` or similar files for API base URL configuration).

#### Executing Simulations

Once both backend and frontend are running:

1.  **Access the Frontend:** Open your web browser to `http://localhost:3000`.
2.  **Configure Simulation:** Use the frontend's interface (e.g., `app/simulation/page.tsx` and `SimulationConfigPanel.tsx`) to define agent populations, choose strategies, and set simulation parameters.
3.  **Start Simulation:** Initiate a simulation run through the frontend. The frontend will make API calls to your local backend, which will then start and manage the simulation.
4.  **Observe/Replay:** Watch the simulation unfold in real-time or access past replays through the frontend's dedicated sections.

### Environment Variables

Crucial configurations, especially for production environments, are typically managed via environment variables.

*   **Backend (`backend/`):**
    *   `DATABASE_URL`: Connection string for the database (e.g., `postgresql://user:password@host:port/dbname`).
    *   `SIMULATION_SECRET_KEY`: A key for secure operations or signing.
    *   `LOG_LEVEL`: Adjust logging verbosity (e.g., `INFO`, `DEBUG`).
    *   These can be loaded from a `.env` file in the `backend/` directory during local development.

*   **Frontend (`frontend/`):**
    *   `NEXT_PUBLIC_BACKEND_URL`: The URL where the frontend can reach the backend API (e.g., `http://localhost:8000` for local, or your deployed backend URL for production).
    *   `NEXT_PUBLIC_WEBSOCKET_URL`: The URL for WebSocket connections (if used for real-time updates).
    *   Next.js environment variables starting with `NEXT_PUBLIC_` are exposed to the browser.

    It's common to have a `.env.local` file in the `frontend/` directory for local development environment variables.

### Deployment Options (Render, local, etc.)

The Cheater's Dilemma system, with its Python backend and Next.js frontend, is well-suited for various deployment strategies:

1.  **Local (Docker/Docker Compose):**
    *   For development or isolated local testing, Docker Compose is an excellent choice. You can define services for the backend, frontend, and a database (e.g., PostgreSQL) in a `docker-compose.yaml` file. This ensures a consistent environment across different machines.

2.  **Cloud Platforms (e.g., Render, Vercel, AWS, Google Cloud, Azure):**
    *   **Backend (FastAPI):** Can be deployed as a web service on platforms like Render, Heroku, AWS EC2/ECS, Google Cloud Run/App Engine, or Azure App Service. These platforms often support Docker deployments or direct Python application deployments.
    *   **Frontend (Next.js):** Vercel (the creators of Next.js) is an ideal platform for deploying Next.js applications, offering seamless continuous deployment from Git repositories. Other platforms like Netlify, Render, or traditional web servers can also host Next.js builds.

3.  **Hybrid Deployment:**
    *   Deploy the Next.js frontend to a specialized frontend hosting service (like Vercel) and the FastAPI backend to a general-purpose application platform (like Render or AWS). This allows for scaling each component independently.

### Common Failure Modes

*   **Backend/Frontend Connection Issues:**
    *   **Symptom:** Frontend shows network errors, "Failed to fetch," or blank data.
    *   **Cause:** Incorrect `NEXT_PUBLIC_BACKEND_URL` in the frontend, or the backend server is not running/accessible.
    *   **Fix:** Verify the backend URL in `frontend/.env.local` (or environment variables in production). Ensure the backend server is running on the expected port and host. Check browser console for network errors.

*   **Database Connection Problems:**
    *   **Symptom:** Backend fails to start or throws database-related errors.
    *   **Cause:** Incorrect `DATABASE_URL`, database server not running, or connection limits reached.
    *   **Fix:** Double-check `DATABASE_URL` in `backend/.env` (or environment variables). Ensure your database server is active and accessible from the backend.

*   **Dependency Issues:**
    *   **Symptom:** Python `ModuleNotFoundError` or JavaScript `Cannot find module` errors.
    *   **Cause:** Dependencies not installed correctly or environment not activated.
    *   **Fix:** Re-run `poetry install` in `backend/` and `npm install` (or `bun install`) in `frontend/`. Ensure you're running backend commands within the Poetry shell (`poetry shell`) if not using `poetry run`.

*   **Port Conflicts:**
    *   **Symptom:** Server fails to start, reporting "Address already in use."
    *   **Cause:** Another application is already using the required port (e.g., 8000 for backend, 3000 for frontend).
    *   **Fix:** Stop the conflicting application, or change the port for the Cheater's Dilemma component (e.g., `uvicorn ... --port 8001`, `npm run dev -- --port 3001`).

*   **Configuration Errors:**
    *   **Symptom:** Unexpected behavior in simulation, incorrect agent actions, or system crashes.
    *   **Cause:** Errors in `rules.yaml`, `world.yaml`, or incorrect interpretation of configuration.
    *   **Fix:** Carefully review the YAML configuration files. Check `backend/app/core/config.py` and `backend/app/core/rules.py` for how these configurations are loaded and applied. Enable verbose logging to help diagnose.

Always check the console output of both your backend and frontend servers, and your browser's developer console for error messages; they provide crucial clues for troubleshooting.
