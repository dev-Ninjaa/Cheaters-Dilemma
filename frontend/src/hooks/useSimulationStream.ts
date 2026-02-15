"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSimulationStreamSocketUrl } from "@/lib/ws";
import { SimulationEvent, SimulationState, SimulationSummary } from "@/lib/types";
import { apiClient } from "@/lib/api";

interface StreamMessage {
  type: string;
  turn?: number;
  turns_completed?: number;
  events?: SimulationEvent[];
  message?: string;
}

type StreamStatus = "idle" | "connecting" | "connected" | "paused" | "complete" | "error";

interface UseSimulationStreamProps {
  simulationId: string | null;
  onTurn: (turn: number, events: SimulationEvent[], simulationState?: SimulationState) => void;
  onComplete: (turnsCompleted: number, summary?: SimulationSummary) => void;
  onError: (error: string) => void;
  onStatusChange: (status: StreamStatus) => void;
}

export function useSimulationStream({
  simulationId,
  onTurn,
  onComplete,
  onError,
  onStatusChange,
}: UseSimulationStreamProps) {
  const socketRef = useRef<WebSocket | null>(null);
  const streamModeRef = useRef<"play" | "step" | null>(null);
  const expectedCloseRef = useRef(false);

  const closeStream = useCallback((status: "paused" | "complete" = "paused") => {
    expectedCloseRef.current = true;
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    streamModeRef.current = null;
    if (status === "complete") {
      return;
    }
    onStatusChange("paused");
  }, [onStatusChange]);

  const connectStream = useCallback(
    (mode: "play" | "step", fromTurn: number) => {
      if (!simulationId) return;

      if (socketRef.current && socketRef.current.readyState <= WebSocket.OPEN) {
        return;
      }

      const intervalMs = mode === "step" ? 60 : 300;
      const url = getSimulationStreamSocketUrl(simulationId, intervalMs, fromTurn);

      onStatusChange("connecting");
      streamModeRef.current = mode;
      expectedCloseRef.current = false;

      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        onStatusChange("connected");
      };

      socket.onmessage = (event) => {
        let payload: StreamMessage;
        try {
          payload = JSON.parse(event.data) as StreamMessage;
        } catch {
          console.error("Failed to parse WebSocket message:", event.data);
          return;
        }

        if (payload.type === "turn" && typeof payload.turn === "number") {
          // Update simulation state after each turn
          if (simulationId) {
            apiClient.getSimulationState(simulationId)
              .then(updatedState => {
                onTurn(payload.turn!, payload.events ?? [], updatedState);
              })
              .catch(error => {
                console.error("Failed to get updated simulation state:", error);
                onTurn(payload.turn!, payload.events ?? []);
              });
          } else {
            onTurn(payload.turn!, payload.events ?? []);
          }

          if (streamModeRef.current === "step") {
            closeStream("paused");
          }
          return;
        }

        if (payload.type === "complete") {
          const turnsCompleted = payload.turns_completed ?? 0;

          // Fetch final summary to show winner
          if (simulationId) {
            apiClient.getSimulationSummary(simulationId)
              .then(summary => {
                onComplete(turnsCompleted, summary);
                onStatusChange("complete");
              })
              .catch(error => {
                console.error("Failed to get simulation summary:", error);
                onComplete(turnsCompleted);
                onStatusChange("complete");
              });
          } else {
            onComplete(turnsCompleted);
            onStatusChange("complete");
          }
          closeStream("complete");
          return;
        }

        if (payload.type === "error") {
          console.error("Simulation error:", payload.message);
          onError(payload.message || "Unknown simulation error");
          onStatusChange("error");
          closeStream();
          return;
        }
      };

      socket.onclose = (event) => {
        socketRef.current = null;
        streamModeRef.current = null;

        if (!expectedCloseRef.current) {
          onError("WebSocket connection lost");
          onStatusChange("error");
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        onError("WebSocket connection error");
        onStatusChange("error");
      };
    },
    [simulationId, onTurn, onComplete, onError, onStatusChange, closeStream]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        expectedCloseRef.current = true;
        socketRef.current.close();
      }
    };
  }, []);

  return {
    connectStream,
    closeStream,
  };
}