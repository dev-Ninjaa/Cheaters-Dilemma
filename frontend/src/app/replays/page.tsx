"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { ReplaySummary } from "@/lib/types";
import { GamePanel, GameButton, StatDisplay } from "@/components/GameUI";

export default function ReplaysPage() {
  const [replays, setReplays] = useState<ReplaySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);

  useEffect(() => {
    const fetchReplays = async () => {
      try {
        const data = await apiClient.getReplays();
        setReplays(data);
      } catch (error) {
        console.error("Failed to fetch replays:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReplays();
  }, []);

  const filtered = selectedStrategy
    ? replays.filter((r) => r.winner_strategy === selectedStrategy)
    : replays;

  const strategyWins = replays.reduce(
    (acc, r) => {
      acc[r.winner_strategy] = (acc[r.winner_strategy] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="w-full h-full overflow-auto p-3 sm:p-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4 h-full">
        {/* Left Panel - Filters & Stats */}
        <div className="lg:col-span-1 space-y-3 sm:space-y-4">
          <GamePanel title="FILTER BY WINNER">
            <div className="space-y-2 text-xs font-mono">
              <button
                onClick={() => setSelectedStrategy(null)}
                className={`w-full text-left p-2 border-2 ${
                  selectedStrategy === null
                    ? "border-[#475569] bg-[#1a1f3a]"
                    : "border-[#eab308] hover:border-[#475569]"
                } text-[#94a3b8] transition-all`}
              >
                <div className="font-bold uppercase text-[#eab308]">ALL STRATEGIES</div>
                <div className="text-[#94a3b8] text-xs mt-1">{replays.length} replays</div>
              </button>
              {Object.entries(strategyWins)
                .sort((a, b) => b[1] - a[1])
                .map(([strategy, count]) => (
                  <button
                    key={strategy}
                    onClick={() => setSelectedStrategy(selectedStrategy === strategy ? null : strategy)}
                    className={`w-full text-left p-2 border-2 ${
                      selectedStrategy === strategy
                        ? "border-[#475569] bg-[#1a1f3a]"
                        : "border-[#eab308] hover:border-[#475569]"
                    } text-[#94a3b8] transition-all`}
                  >
                    <div className="font-bold uppercase text-[#eab308]">{strategy}</div>
                    <div className="text-[#94a3b8] text-xs mt-1">{count} victories</div>
                  </button>
                ))}
            </div>
          </GamePanel>

          <GamePanel title="STATISTICS">
            <div className="space-y-2 text-xs text-[#94a3b8]">
              <StatDisplay label="Total Replays" value={replays.length} />
              <StatDisplay label="Avg agents" value={(replays.reduce((s, r) => s + r.agent_count, 0) / replays.length).toFixed(0)} />
              <StatDisplay label="Avg turns" value={(replays.reduce((s, r) => s + r.turns_completed, 0) / replays.length).toFixed(0)} />
            </div>
          </GamePanel>

          <Link href="/" className="block">
            <GameButton className="w-full">BACK TO MENU</GameButton>
          </Link>
        </div>

        {/* Center - Replay List */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-[#eab308] font-mono text-2xl">&gt; LOADING REPLAYS... &lt;</div>
            </div>
          ) : filtered.length === 0 ? (
            <GamePanel title="NO REPLAYS FOUND" className="max-w-md mx-auto mt-12">
              <div className="space-y-4 text-center">
                <p className="text-[#94a3b8] font-mono">
                  {selectedStrategy
                    ? `No replays won by ${selectedStrategy} yet`
                    : "No replays available yet"}
                </p>
                <Link href="/simulation" className="block">
                  <GameButton className="w-full">START SIMULATION</GameButton>
                </Link>
              </div>
            </GamePanel>
          ) : (
            <div className="space-y-3 sm:space-y-4 h-full overflow-y-auto">
              {filtered.map((replay, idx) => (
                <GamePanel key={replay.replay_id} title={`REPLAY ${idx + 1}`} className="p-4 sm:p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="text-center">
                      <div className="text-lg sm:text-2xl font-bold text-[#eab308]">{replay.agent_count}</div>
                      <div className="text-xs text-[#94a3b8]">AGENTS</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg sm:text-2xl font-bold text-[#eab308]">{replay.turns_completed}</div>
                      <div className="text-xs text-[#94a3b8]">TURNS</div>
                    </div>
                    <div className="text-center col-span-2 sm:col-span-1">
                      <div className="text-sm sm:text-lg font-bold text-[#475569] uppercase">{replay.winner_strategy}</div>
                      <div className="text-xs text-[#94a3b8]">WINNER</div>
                    </div>
                    <div className="text-center col-span-2 sm:col-span-1">
                      <div className="text-lg sm:text-2xl font-bold text-[#eab308]">{replay.winner_resources}</div>
                      <div className="text-xs text-[#94a3b8]">RESOURCES</div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-[#94a3b8] font-mono mb-4 gap-2">
                    <span>SEED: {replay.seed}</span>
                    <span className="text-xs">{new Date(replay.created_at).toLocaleString()}</span>
                  </div>

                  <Link href={`/replays/${replay.replay_id}`} className="block">
                    <GameButton className="w-full">VIEW REPLAY</GameButton>
                  </Link>
                </GamePanel>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

