// API client for The Cheater's Dilemma backend
import { SimulationState, SimulationEvents, SimulationSummary, AgentSummary, AgentDetail, Ruleset, RuleHistory, ReplaySummary, ReplayDetail } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    // Normalize trailing slash to avoid double-slash paths like /api/v1//simulation/start
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Simulation endpoints
  async startSimulation(config: {
    agent_count: number;
    seed: number;
    turns?: number;
  }): Promise<{ simulation_id: string }> {
    return this.request<{ simulation_id: string }>('/simulation/start', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async stepSimulation(simulationId: string, steps: number = 1): Promise<SimulationState> {
    return this.request<SimulationState>(`/simulation/${simulationId}/step`, {
      method: 'POST',
      body: JSON.stringify({ steps }),
    });
  }

  async getSimulationState(simulationId: string): Promise<SimulationState> {
    return this.request<SimulationState>(`/simulation/${simulationId}/state`);
  }

  async getSimulationEvents(simulationId: string, sinceTurn: number = 0): Promise<SimulationEvents> {
    return this.request<SimulationEvents>(`/simulation/${simulationId}/events?since_turn=${sinceTurn}`);
  }

  async getSimulationSummary(simulationId: string): Promise<SimulationSummary> {
    return this.request<SimulationSummary>(`/simulation/${simulationId}/summary`);
  }

  // Agent endpoints
  async getAgents(simulationId: string): Promise<AgentSummary[]> {
    return this.request<AgentSummary[]>(`/agents/?simulation_id=${simulationId}`);
  }

  async getAgentDetail(agentId: number, simulationId: string): Promise<AgentDetail> {
    return this.request<AgentDetail>(`/agents/${agentId}?simulation_id=${simulationId}`);
  }

  // Rules endpoints
  async getCurrentRules(simulationId: string): Promise<Ruleset> {
    return this.request<Ruleset>(`/rules/?simulation_id=${simulationId}`);
  }

  async getRulesHistory(simulationId: string): Promise<RuleHistory[]> {
    return this.request<RuleHistory[]>(`/rules/history?simulation_id=${simulationId}`);
  }

  // Replay endpoints
  async getReplays(): Promise<ReplaySummary[]> {
    return this.request<ReplaySummary[]>('/replays/');
  }

  async getReplayDetail(replayId: string): Promise<ReplayDetail> {
    return this.request<ReplayDetail>(`/replays/${replayId}`);
  }

  // Generic HTTP methods
  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

export const apiClient = new ApiClient();
