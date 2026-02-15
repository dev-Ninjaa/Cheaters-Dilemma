"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api";
import { AgentDetail } from "@/lib/types";
import { GamePanel, GameButton, StatDisplay } from "@/components/GameUI";

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = parseInt(params.id as string);
  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulationId] = useState("default");

  useEffect(() => {
    const loadAgent = async () => {
      try {
        const agentData = await apiClient.getAgentDetail(agentId, simulationId);
        setAgent(agentData);
      } catch (error) {
        console.error("Failed to load agent:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAgent();
  }, [agentId, simulationId]);

  if (loading) {
    return (
      <div className="w-full h-full overflow-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
          <div className="lg:col-span-4 flex items-center justify-center">
            <div className="text-yellow-500 font-mono text-2xl">
              LOADING AGENT DATA...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="w-full h-full overflow-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
          <div className="lg:col-span-4 flex items-center justify-center">
            <GamePanel title="ERROR" variant="red">
              <p className="text-red-500 font-mono">Agent not found</p>
              <Link href="/agents" className="block mt-4">
                <GameButton className="w-full">BACK TO AGENTS</GameButton>
              </Link>
            </GamePanel>
          </div>
        </div>
      </div>
    );
  }

  const strategyColors: Record<string, string> = {
    cheater: "text-red-500",
    greedy: "text-yellow-500",
    politician: "text-blue-400",
    warlord: "text-orange-500",
  };

  const successRate =
    agent.total_actions > 0
      ? ((agent.successful_actions / agent.total_actions) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="w-full h-full overflow-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
        {/* Left Panel - Agent Info */}
        <div className="lg:col-span-1 space-y-4">
          <GamePanel title="AGENT STATUS" variant="blue">
            <div className="space-y-3 text-xs font-mono">
              <div>
                <span className="text-yellow-500">ID:</span>
                <span className="float-right text-slate-300">
                  {agent.agent_id}
                </span>
              </div>
              <div>
                <span className="text-yellow-500">STRATEGY:</span>
                <span
                  className={`float-right uppercase font-bold ${strategyColors[agent.strategy]}`}
                >
                  {agent.strategy}
                </span>
              </div>
              <div>
                <span className="text-yellow-500">STATUS:</span>
                <span
                  className={`float-right font-bold ${agent.alive ? "text-green-400" : "text-red-500"}`}
                >
                  {agent.alive ? "ALIVE" : "DEAD"}
                </span>
              </div>
            </div>
          </GamePanel>

          <GamePanel title="TOKENS & POWER" variant="green">
            <div className="space-y-2 text-xs text-slate-300">
              <StatDisplay label="Tokens" value={agent.resources} />
              <StatDisplay label="Strength" value={agent.strength} />
              <StatDisplay
                label="Trust"
                value={agent.trust.toFixed(2)}
                unit="/1.0"
              />
              <StatDisplay
                label="Aggression"
                value={agent.aggression.toFixed(2)}
                unit="/1.0"
              />
            </div>
          </GamePanel>

          <GamePanel title="ACTION RECORD" variant="yellow">
            <div className="space-y-2 text-xs text-slate-300">
              <StatDisplay label="Total" value={agent.total_actions} />
              <StatDisplay
                label="Successful"
                value={agent.successful_actions}
              />
              <StatDisplay label="Failed" value={agent.failed_actions} />
              <StatDisplay label="Success Rate" value={`${successRate}%`} />
            </div>
          </GamePanel>

          <Link href="/agents" className="block">
            <GameButton className="w-full">BACK TO AGENTS</GameButton>
          </Link>
        </div>

        {/* Center - Charts & History */}
        <div className="lg:col-span-3">
          <div className="space-y-4 h-full overflow-y-auto">
            <GamePanel title="RESOURCE HISTORY" className="mb-4" variant="blue">
              <div className="h-32 flex items-end gap-1 bg-slate-900 p-4 border border-blue-600">
                {agent.resource_history.slice(0, 20).map((val, idx) => {
                  const max = Math.max(...agent.resource_history);
                  const height = max > 0 ? (val / max) * 100 : 0;
                  return (
                    <div
                      key={idx}
                      className="flex-1 bg-gradient-to-t from-blue-500 to-yellow-500 opacity-80 hover:opacity-100 rounded-t-sm"
                      style={{ height: `${Math.max(height, 5)}%` }}
                      title={`Turn ${idx}: ${val} tokens`}
                    />
                  );
                })}
              </div>
            </GamePanel>

            <GamePanel title="TRUST TIMELINE" variant="green">
              <div className="h-32 flex items-end gap-1 bg-slate-900 p-4 border border-green-600">
                {agent.reputation_history.slice(0, 20).map((val, idx) => {
                  const height = (val / 1.0) * 100;
                  return (
                    <div
                      key={idx}
                      className="flex-1 bg-gradient-to-t from-green-500 to-yellow-500 rounded-t-sm"
                      style={{ height: `${Math.max(height, 5)}%` }}
                      title={`Turn ${idx}: ${val.toFixed(2)} trust`}
                    />
                  );
                })}
              </div>
            </GamePanel>
          </div>
        </div>
      </div>
    </div>
  );
}
