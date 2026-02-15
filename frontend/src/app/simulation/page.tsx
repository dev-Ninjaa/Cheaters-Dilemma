"use client";

import { useCallback, useReducer } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { SimulationState, SimulationEvent, SimulationSummary } from "@/lib/types";
import { SimulationControls } from "@/components/SimulationControls";
import { LiveEventLog } from "@/components/LiveEventLog";
import { GamePanel, GameButton } from "@/components/GameUI";
import GameBoard from "@/components/GameBoard";
import AgentCard from "@/components/AgentCard";
import { Modal } from "@/components/Modal";
import { FinalResults } from "@/components/FinalResults";
import { useSimulationStream } from "@/hooks/useSimulationStream";
import { SimulationConfigPanel } from "@/components/SimulationConfigPanel";
import { SimulationStatusPanel } from "@/components/SimulationStatusPanel";
import { LaunchConfigPanel } from "@/components/LaunchConfigPanel";

interface SimulationConfig {
  agent_count: number;
  seed: number;
  turns: number | undefined;
}

type StreamStatus = "idle" | "connecting" | "connected" | "paused" | "complete" | "error";

interface SimulationPageState {
  simulationId: string | null;
  simulationState: SimulationState | null;
  simulationSummary: SimulationSummary | null;
  events: SimulationEvent[];
  displayTurn: number;
  isRunning: boolean;
  isAutoPlaying: boolean;
  isStepping: boolean;
  streamStatus: StreamStatus;
  streamError: string | null;
  config: SimulationConfig;
  selectedAgentId: number | null;
  showResultsModal: boolean;
}

type SimulationPageAction =
  | { type: "SET_CONFIG"; patch: Partial<SimulationConfig> }
  | { type: "START_REQUEST" }
  | { type: "START_SUCCESS"; simulationId: string; simulationState: SimulationState }
  | { type: "START_FAILURE"; error?: string }
  | { type: "STREAM_CONNECTING"; mode: "play" | "step" }
  | { type: "STREAM_CONNECTED" }
  | { type: "STREAM_TURN"; turn: number; events: SimulationEvent[]; simulationState?: SimulationState }
  | { type: "STREAM_PAUSED" }
  | { type: "STREAM_COMPLETE"; turnsCompleted: number; summary?: SimulationSummary }
  | { type: "STREAM_ERROR"; error: string }
  | { type: "RESET" }
  | { type: "SELECT_AGENT"; agentId: number | null }
  | { type: "SHOW_RESULTS_MODAL"; show: boolean };

const DEFAULT_CONFIG: SimulationConfig = {
  agent_count: 10,
  seed: 42,
  turns: undefined,
};

const initialState: SimulationPageState = {
  simulationId: null,
  simulationState: null,
  simulationSummary: null,
  events: [],
  displayTurn: 0,
  isRunning: false,
  isAutoPlaying: false,
  isStepping: false,
  streamStatus: "idle",
  streamError: null,
  config: DEFAULT_CONFIG,
  selectedAgentId: null,
  showResultsModal: false,
};

function mergeEvents(existing: SimulationEvent[], incoming: SimulationEvent[]): SimulationEvent[] {
  if (incoming.length === 0) return existing;
  const seen = new Set(existing.map((e) => `${e.turn}:${e.actor}:${e.action}:${e.target}:${e.outcome}`));
  const merged = [...existing];
  for (const event of incoming) {
    const key = `${event.turn}:${event.actor}:${event.action}:${event.target}:${event.outcome}`;
    if (!seen.has(key)) {
      merged.push(event);
      seen.add(key);
    }
  }
  return merged;
}

function simulationReducer(state: SimulationPageState, action: SimulationPageAction): SimulationPageState {
  switch (action.type) {
    case "SET_CONFIG":
      return {
        ...state,
        config: {
          ...state.config,
          ...action.patch,
        },
      };
    case "START_REQUEST":
      return {
        ...state,
        isRunning: true,
        isAutoPlaying: false,
        isStepping: false,
        streamStatus: "idle",
        streamError: null,
      };
    case "START_SUCCESS":
      return {
        ...state,
        simulationId: action.simulationId,
        simulationState: action.simulationState,
        events: [],
        displayTurn: 0,
        isRunning: false,
        isAutoPlaying: false,
        isStepping: false,
        streamStatus: "idle",
        streamError: null,
      };
    case "START_FAILURE":
      return {
        ...state,
        isRunning: false,
        streamStatus: "error",
        streamError: action.error || "Failed to start simulation",
      };
    case "STREAM_CONNECTING":
      return {
        ...state,
        isAutoPlaying: action.mode === "play",
        isStepping: action.mode === "step",
        streamStatus: "connecting",
        streamError: null,
      };
    case "STREAM_CONNECTED":
      return {
        ...state,
        streamStatus: "connected",
      };
    case "STREAM_TURN":
      return {
        ...state,
        displayTurn: Math.max(state.displayTurn, action.turn),
        events: mergeEvents(state.events, action.events),
        simulationState: action.simulationState ?? state.simulationState,
      };
    case "STREAM_PAUSED":
      return {
        ...state,
        isAutoPlaying: false,
        isStepping: false,
        streamStatus: "paused",
      };
    case "STREAM_COMPLETE":
      return {
        ...state,
        displayTurn: Math.max(state.displayTurn, action.turnsCompleted),
        isAutoPlaying: false,
        isStepping: false,
        streamStatus: "complete",
        simulationSummary: action.summary ?? state.simulationSummary,
        showResultsModal: true,
      };
    case "SHOW_RESULTS_MODAL":
      return {
        ...state,
        showResultsModal: action.show,
      };
    case "STREAM_ERROR":
      return {
        ...state,
        isAutoPlaying: false,
        isStepping: false,
        streamStatus: "error",
        streamError: action.error,
      };
    case "RESET":
      return {
        ...initialState,
        config: state.config,
      };
    case "SELECT_AGENT":
      return {
        ...state,
        selectedAgentId: action.agentId,
      };
    default:
      return state;
  }
}

export default function SimulationPage() {
  const [state, dispatch] = useReducer(simulationReducer, initialState);

  const handleStreamTurn = useCallback((turn: number, events: SimulationEvent[], simulationState?: SimulationState) => {
    dispatch({ type: "STREAM_TURN", turn, events, simulationState });
  }, []);

  const handleStreamComplete = useCallback((turnsCompleted: number, summary?: SimulationSummary) => {
    dispatch({ type: "STREAM_COMPLETE", turnsCompleted, summary });
  }, []);

  const handleStreamError = useCallback((error: string) => {
    dispatch({ type: "STREAM_ERROR", error });
  }, []);

  const handleStreamStatusChange = useCallback((status: StreamStatus) => {
    switch (status) {
      case "connecting":
        dispatch({ type: "STREAM_CONNECTING", mode: "play" });
        break;
      case "connected":
        dispatch({ type: "STREAM_CONNECTED" });
        break;
      case "paused":
        dispatch({ type: "STREAM_PAUSED" });
        break;
      case "complete":
        // Status change handled in handleStreamComplete
        break;
      case "error":
        // Error handled in handleStreamError
        break;
    }
  }, []);

  const { connectStream, closeStream } = useSimulationStream({
    simulationId: state.simulationId,
    onTurn: handleStreamTurn,
    onComplete: handleStreamComplete,
    onError: handleStreamError,
    onStatusChange: handleStreamStatusChange,
  });

  const startSimulation = async () => {
    try {
      dispatch({ type: "START_REQUEST" });
      const response = await apiClient.startSimulation(state.config);
      const simulationState = await apiClient.getSimulationState(response.simulation_id);

      dispatch({
        type: "START_SUCCESS",
        simulationId: response.simulation_id,
        simulationState,
      });
    } catch (error) {
      console.error("Failed to start simulation:", error);
      dispatch({ type: "START_FAILURE", error: "Failed to start simulation" });
    }
  };

  const stepSimulation = useCallback(async () => {
    connectStream("step", state.displayTurn + 1);
  }, [connectStream, state.displayTurn]);

  const playSimulation = () => {
    console.log("Play button clicked, simulationId:", state.simulationId);
    console.log("Current state:", {
      displayTurn: state.displayTurn,
      simulationState: state.simulationState,
      streamStatus: state.streamStatus
    });
    connectStream("play", state.displayTurn + 1);
  };

  const pauseSimulation = useCallback(() => {
    closeStream("paused");
  }, [closeStream]);

  const resetSimulation = () => {
    closeStream("paused");
    dispatch({ type: "RESET" });
  };

  const saveReplay = useCallback(async () => {
    if (!state.simulationId) {
      console.error("No simulation ID available for saving replay");
      return;
    }

    try {
      console.log("Saving replay for simulation:", state.simulationId);
      await apiClient.post(`/api/v1/simulation/${state.simulationId}/save-replay`);
      console.log("Replay saved successfully");
      // Could add a toast notification here if desired
    } catch (error) {
      console.error("Failed to save replay:", error);
      // Could add error handling/toast here
    }
  }, [state.simulationId]);

  const selectedAgent = state.simulationState?.agents.find(a => a.agent_id === state.selectedAgentId) || null;

  const maxTurns = state.config.turns || 500;

  if (!state.simulationId) {
    return (
      <div className="w-full h-screen bg-[#0f1419] p-8 flex items-center justify-center">
        <LaunchConfigPanel
          config={state.config}
          onConfigChange={(patch) => dispatch({ type: "SET_CONFIG", patch })}
          onStart={startSimulation}
          isRunning={state.isRunning}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
        <div className="lg:col-span-1 space-y-4">
          <SimulationControls
            isRunning={state.isRunning || state.isAutoPlaying || state.isStepping || state.streamStatus === "connecting"}
            currentTurn={state.displayTurn}
            maxTurns={maxTurns}
            onStep={stepSimulation}
            onPlay={playSimulation}
            onPause={pauseSimulation}
            onReset={resetSimulation}
            onSaveReplay={saveReplay}
            seedValue={state.config.seed}
            agentCount={state.simulationState?.alive_count || state.config.agent_count}
            metrics={state.simulationState?.metrics}
          />

          <SimulationStatusPanel
            streamStatus={state.streamStatus}
            currentTurn={state.displayTurn}
            maxTurns={maxTurns}
            eventCount={state.events.length}
            streamError={state.streamError}
          />

          {state.streamStatus === "complete" && state.simulationSummary && (
            <GamePanel title="🏆 FINAL RESULTS">
              <FinalResults simulationSummary={state.simulationSummary} compact={true} />
            </GamePanel>
          )}

          <SimulationConfigPanel
            config={state.config}
            onConfigChange={(patch) => dispatch({ type: "SET_CONFIG", patch })}
            onStart={startSimulation}
            isRunning={state.isRunning || state.isStepping}
          />
        </div>

        <div className="lg:col-span-2">
          <GamePanel title="WORLD VISUALIZATION" className="h-full">
            {!state.simulationState ? (
              <div className="h-full flex items-center justify-center text-[#94a3b8] font-mono text-center">
                <div>
                  <div className="text-xl font-bold text-[#eab308] mb-4">&gt; READY TO LAUNCH &lt;</div>
                  <div className="text-sm opacity-50">Configure parameters and start simulation</div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div className="flex-1 mb-4 min-h-0 flex items-center justify-center">
                  <GameBoard
                    agents={state.simulationState.agents}
                    onAgentClick={(agent) => dispatch({ type: "SELECT_AGENT", agentId: agent.agent_id })}
                    selectedAgentId={state.selectedAgentId}
                    showInteractions={true}
                    agentCount={state.config.agent_count}
                    seed={state.config.seed}
                    recentEvents={state.events.slice(-20)} // Pass last 20 events for action display
                  />
                </div>


                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <GamePanel title="RESOURCE DISTRIBUTION">
                    <div className="space-y-2 text-xs font-mono">
                      {state.simulationState.agents.slice(0, 5).map((agent) => (
                        <div key={agent.agent_id} className="flex justify-between">
                          <span className="text-[#94a3b8]">Agent {agent.agent_id}:</span>
                          <span className="text-[#eab308]">${agent.resources}</span>
                        </div>
                      ))}
                      {state.simulationState.agents.length > 5 && (
                        <div className="text-[#94a3b8] opacity-50">... +{state.simulationState.agents.length - 5} more</div>
                      )}
                    </div>
                  </GamePanel>
                  <GamePanel title="TRUST DISTRIBUTION">
                    <div className="space-y-2 text-xs font-mono">
                      {state.simulationState.agents.slice(0, 5).map((agent) => (
                        <div key={agent.agent_id} className="flex justify-between">
                          <span className="text-[#94a3b8]">Agent {agent.agent_id}:</span>
                          <span className="text-[#eab308]">{agent.trust?.toFixed(2)}</span>
                        </div>
                      ))}
                      {state.simulationState.agents.length > 5 && (
                        <div className="text-[#94a3b8] opacity-50">... +{state.simulationState.agents.length - 5} more</div>
                      )}
                    </div>
                  </GamePanel>
                  <GamePanel title="METRICS">
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-[#94a3b8]">GINI:</span>
                        <span className="text-[#eab308]">{state.simulationState.metrics?.gini_resources?.toFixed(3) || "0.000"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#94a3b8]">HHI:</span>
                        <span className="text-[#eab308]">{state.simulationState.metrics?.hhi_resources?.toFixed(3) || "0.000"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#94a3b8]">AVG STR:</span>
                        <span className="text-[#eab308]">{state.simulationState.metrics?.avg_strength?.toFixed(2) || "0.00"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#94a3b8]">AVG TOK:</span>
                        <span className="text-[#eab308]">{state.simulationState.metrics?.avg_resources?.toFixed(2) || "0.00"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#94a3b8]">GOV:</span>
                        <span className="text-[#eab308]">{state.simulationState.metrics?.governance_level?.toFixed(2) || "0.00"}</span>
                      </div>
                    </div>
                  </GamePanel>
                </div>
              </div>
            )}
          </GamePanel>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <GamePanel title="SELECTED AGENT">
            <AgentCard 
              agent={selectedAgent} 
              recentEvents={state.events.slice(-10)} // Pass last 10 events for status display
            />
          </GamePanel>

          <GamePanel title="EVENT LOG">
            <LiveEventLog
              events={state.events.map((event) => ({
                turn: event.turn,
                action: event.action,
                actor: event.actor,
                target: event.target,
                message: `${event.action.toUpperCase()}: ${event.actor} -> ${event.target ?? "WORLD"}`,
                narrative: event.narrative,
                type: event.outcome.includes("success") ? "success" : "neutral",
              }))}
              live={state.isAutoPlaying || state.isStepping || state.streamStatus === "connecting" || state.streamStatus === "connected"}
              maxHeight="h-[28rem]"
            />
          </GamePanel>
        </div>
      </div>

      {state.showResultsModal && state.simulationSummary && (
        <Modal
          isOpen={state.showResultsModal}
          title="🏆 FINAL RESULTS"
          onClose={() => dispatch({ type: "SHOW_RESULTS_MODAL", show: false })}
        >
          <FinalResults simulationSummary={state.simulationSummary} showActionSummary={true} compact={false} />

          <div className="flex justify-center gap-2 pt-4">
            <GameButton onClick={() => dispatch({ type: "SHOW_RESULTS_MODAL", show: false })}>
              CLOSE
            </GameButton>
            <GameButton onClick={resetSimulation}>
              NEW SIMULATION
            </GameButton>
          </div>
        </Modal>
      )}
    </div>
  );
}

