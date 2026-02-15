"use client";

import { SimulationSummary } from "@/lib/types";
import { GamePanel } from "@/components/GameUI";

interface FinalResultsProps {
  simulationSummary: SimulationSummary;
  showActionSummary?: boolean;
  compact?: boolean;
}

export function FinalResults({
  simulationSummary,
  showActionSummary = true,
  compact = false,
}: FinalResultsProps) {
  const winner = simulationSummary.leaderboard[0];

  return (
    <div className="space-y-3">
      <div className="text-center">
        <div
          className={`font-bold text-yellow-500 mb-2 ${compact ? "text-lg" : "text-xl"}`}
        >
          WINNER
        </div>
        <div
          className={`font-mono text-slate-300 ${compact ? "text-lg" : "text-2xl"}`}
        >
          {winner?.strategy.toUpperCase()} #{winner?.agent_id}
        </div>
        <div
          className={`text-slate-400 mt-1 ${compact ? "text-sm" : "text-base"}`}
        >
          {winner?.resources} resources
        </div>
      </div>

      <div className="border-t border-slate-700/50 pt-3">
        <div
          className={`text-yellow-500 mb-2 ${compact ? "text-xs" : "text-sm"}`}
        >
          LEADERBOARD
        </div>
        {simulationSummary.leaderboard
          .slice(0, compact ? 5 : 10)
          .map((agent, index) => (
            <div
              key={agent.agent_id}
              className={`flex justify-between font-mono mb-1 ${compact ? "text-xs" : "text-sm"}`}
            >
              <span
                className={index === 0 ? "text-yellow-500" : "text-slate-300"}
              >
                #{index + 1} {agent.strategy} #{agent.agent_id}
              </span>
              <span className="text-slate-400">{agent.resources}</span>
            </div>
          ))}
      </div>

      {showActionSummary && (
        <div className="border-t border-slate-700/50 pt-3">
          <div
            className={`text-yellow-500 mb-2 ${compact ? "text-xs" : "text-sm"}`}
          >
            ACTION SUMMARY
          </div>

          <div className="grid grid-cols-2 gap-2">
            {Object.entries(simulationSummary.action_counts).map(
              ([action, count]) => (
                <div
                  key={action}
                  className="flex justify-between items-center bg-slate-900 border border-slate-700 p-2 rounded-sm"
                >
                  <span className="text-slate-400 text-sm uppercase">
                    {action.replace("_", " ")}
                  </span>
                  <span className="text-slate-300 font-mono">{count}</span>
                </div>
              ),
            )}
          </div>

          {/* On-chain transfer summary (if available) */}
          {simulationSummary.blockchain_transfers && (
            <div className="mt-3">
              <div className={`text-yellow-500 mb-2 ${compact ? "text-xs" : "text-sm"}`}>
                ON-CHAIN TRANSFERS
              </div>
              <div className="flex gap-2">
                <div className="flex-1 bg-slate-900 border border-slate-700 p-2 rounded-sm text-center">
                  <div className="text-slate-400 text-xs">Executed</div>
                  <div className="text-green-400 font-mono">{simulationSummary.blockchain_transfers.executed}</div>
                </div>
                <div className="flex-1 bg-slate-900 border border-slate-700 p-2 rounded-sm text-center">
                  <div className="text-slate-400 text-xs">Failed</div>
                  <div className="text-red-400 font-mono">{simulationSummary.blockchain_transfers.failed}</div>
                </div>
                <div className="flex-1 bg-slate-900 border border-slate-700 p-2 rounded-sm text-center">
                  <div className="text-slate-400 text-xs">Total</div>
                  <div className="text-slate-300 font-mono">{simulationSummary.blockchain_transfers.total_transfers}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

