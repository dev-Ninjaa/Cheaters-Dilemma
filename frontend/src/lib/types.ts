// TypeScript types matching backend Pydantic schemas

import { ReactNode } from 'react';

export interface AgentSummary {
  agent_id: number;
  strategy: string;
  resources: number; // Keep for backward compatibility, maps to token_balance
  strength: number;
  alive: boolean;
  trust: number;
  aggression: number;
  rank?: number;
  health: number;
  kills: number;
}

export interface AgentDetail extends AgentSummary {
  total_actions: number;
  successful_actions: number;
  failed_actions: number;
  reputation_history: number[];
  resource_history: number[];
}

export interface Metrics {
  gini_resources: number;        // 0.0 = equal, 1.0 = one agent has all
  hhi_resources: number;         // Herfindahl-Hirschman Index
  avg_strength: number;
  avg_resources: number;
  governance_level: number;      // How much rules are active
}

export interface SimulationState {
  simulation_id: string;
  current_turn: number;
  agents: AgentSummary[];
  rules: number;
  alive_count: number;
  event_count: number;
  metrics?: Metrics;
}

export interface EventDetails {
  [key: string]: string | number | boolean | null | undefined;
}

export interface SimulationEvent {
  turn: number;
  actor: number;
  action: string;
  target: number | null;
  outcome: string;
  rule_justification: string;
  details: EventDetails;
  narrative?: string;  // Human-readable description
}

export interface SimulationEvents {
  simulation_id: string;
  events: SimulationEvent[];
  total_events: number;
}

export interface SimulationNarratives {
  simulation_id: string;
  narratives: string[];
  total_narratives: number;
  since_turn: number;
}

export interface SimulationSummary {
  simulation_id: string;
  seed: number;
  turns_completed: number;
  leaderboard: AgentSummary[];
  action_counts: Record<string, number>;
  log_digest: string;
  rules_version: number;
}

export type RuleValue = string | number | boolean | string[] | number[];

export interface Ruleset {
  version: number;
  rules: Record<string, RuleValue>;
}

export interface RuleHistory {
  turn: number;
  version: number;
  change_type: string;
  changed_by: number | null;
  key: string | null;
  old_value: string | number | boolean | null;
  new_value: string | number | boolean | null;
  description: string;
}

export interface AgentLeaderboardEntry {
  agent_id: number;
  strategy: string;
  resources: number;
  strength: number;
  alive: boolean;
  [key: string]: string | number | boolean;
}

export interface ReplayEvent {
  turn: number;
  actor?: number;
  action: string;
  target?: number | null;
  outcome?: string;
  details?: EventDetails;
}

export interface ReplaySummary {
  replay_id: string;
  seed: number;
  agent_count: number;
  turns_completed: number;
  winner_strategy: string;
  winner_resources: number;
  created_at: string;
}

export interface ReplayDetail {
  replay_id: string;
  seed: number;
  agent_count: number;
  turns_completed: number;
  leaderboard: AgentLeaderboardEntry[];
  events: ReplayEvent[];
  log_digest: string;
}

// Component prop interfaces
export interface GameButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export interface StatDisplayProps {
  label: string;
  value: string | number;
  unit?: string;
  className?: string;
}

export interface Agent {
  id?: number;
  agent_id?: number;
  name?: string;
  strategy?: string;
  type?: string;
  resources?: number;
  strength?: number;
  trust?: number;
  aggression?: number;
  alive?: boolean;
}

export interface AgentCardProps {
  agent: Agent;
  rank: number;
}

export interface EventLogEntry {
  turn: number;
  message: string;
  narrative?: string;
  type?: string;
  action?: string;
  actor?: number;
  target?: number | null;
}

export interface EventLogProps {
  events: EventLogEntry[];
  maxHeight?: string;
  showControls?: boolean;
  live?: boolean;
}
