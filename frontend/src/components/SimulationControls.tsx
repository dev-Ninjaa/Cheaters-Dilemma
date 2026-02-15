"use client";

import { GamePanel, GameButton, StatDisplay } from "@/components/GameUI";
import { Play, Pause, SkipForward, RotateCcw, Download, Save } from "lucide-react";

interface Metrics {
  gini_resources: number;
  hhi_resources: number;
  avg_strength: number;
  avg_resources: number;
  governance_level: number;
}

interface SimulationControlsProps {
  isRunning: boolean;
  currentTurn: number;
  maxTurns?: number;
  onStep?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onReset?: () => void;
  onExport?: () => void;
  onSaveReplay?: () => void;
  seedValue?: number;
  agentCount?: number;
  metrics?: Metrics;
}

export function SimulationControls({
  isRunning,
  currentTurn,
  maxTurns,
  onStep,
  onPlay,
  onPause,
  onReset,
  onExport,
  onSaveReplay,
  seedValue,
  agentCount,
  metrics,
}: SimulationControlsProps) {
  const progress = maxTurns ? (currentTurn / maxTurns) * 100 : 0;

  return (
    <GamePanel title="SIMULATION">
      <div className="space-y-3 sm:space-y-4">
        {/* Current Stats - Mobile First */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 text-xs">
          <div className="bg-slate-900/50 p-2 sm:p-3 rounded border border-slate-600">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">TURN</div>
            <div className="text-white font-mono text-sm sm:text-base">{currentTurn}{maxTurns ? ` / ${maxTurns}` : ""}</div>
          </div>
          <div className="bg-slate-900/50 p-2 sm:p-3 rounded border border-slate-600">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">AGENTS</div>
            <div className="text-white font-mono text-sm sm:text-base">{agentCount || "?"}</div>
          </div>
          {seedValue && (
            <div className="bg-slate-900/50 p-2 sm:p-3 rounded border border-slate-600 col-span-2 sm:col-span-1">
              <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">SEED</div>
              <div className="text-white font-mono text-sm sm:text-base">{seedValue}</div>
            </div>
          )}
        </div>

        {/* Live Metrics - Collapsible on mobile */}
        {metrics && (
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <StatDisplay label="GINI" value={metrics.gini_resources.toFixed(2)} />
              <StatDisplay label="AVG STR" value={metrics.avg_strength.toFixed(1)} />
              <StatDisplay label="AVG RES" value={metrics.avg_resources.toFixed(1)} />
              <StatDisplay label="GOV" value={metrics.governance_level.toFixed(2)} />
            </div>
          </div>
        )}

        {/* Progress Bar - Responsive height */}
        <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-2 border-cyan-500/50 h-8 sm:h-10 overflow-hidden rounded-sm shadow-[0_0_15px_rgba(6,182,212,0.3)]">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.6)]"
            style={{ width: `${progress}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center px-2 sm:px-3">
            <span className="text-xs sm:text-sm font-bold text-cyan-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              TURN {currentTurn}{maxTurns ? `/${maxTurns}` : ''}
            </span>
          </div>
        </div>

        {/* Control Buttons - Mobile optimized */}
        <div className="space-y-2 sm:space-y-3">
          {/* Primary Controls - Stack on mobile, grid on larger screens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {onPlay && (
              <GameButton
                onClick={onPlay}
                disabled={isRunning}
                className={`text-xs sm:text-sm py-2 sm:py-3 px-3 sm:px-4 font-bold border-2 transition-all duration-300 rounded-sm min-h-[44px] touch-manipulation ${
                  isRunning
                    ? 'opacity-50 cursor-not-allowed bg-gray-700 border-gray-600 text-gray-400'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-400 text-white hover:from-green-400 hover:to-emerald-500 hover:border-green-300 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)] active:scale-95'
                }`}
              >
                <Play size={16} className="sm:w-5 sm:h-5 mr-2" />
                PLAY
              </GameButton>
            )}
            {onPause && (
              <GameButton
                onClick={onPause}
                disabled={!isRunning}
                className={`text-xs sm:text-sm py-2 sm:py-3 px-3 sm:px-4 font-bold border-2 transition-all duration-300 rounded-sm min-h-[44px] touch-manipulation ${
                  !isRunning
                    ? 'opacity-50 cursor-not-allowed bg-gray-700 border-gray-600 text-gray-400'
                    : 'bg-gradient-to-r from-yellow-500 to-orange-600 border-yellow-400 text-white hover:from-yellow-400 hover:to-orange-500 hover:border-yellow-300 hover:shadow-[0_0_15px_rgba(251,191,36,0.4)] active:scale-95'
                }`}
              >
                <Pause size={16} className="sm:w-5 sm:h-5 mr-2" />
                PAUSE
              </GameButton>
            )}
          </div>

          {/* Secondary Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {onStep && (
              <GameButton
                onClick={onStep}
                disabled={isRunning}
                className={`text-xs sm:text-sm py-2 sm:py-3 px-3 sm:px-4 font-bold border-2 transition-all duration-300 rounded-sm min-h-[44px] touch-manipulation ${
                  isRunning
                    ? 'opacity-50 cursor-not-allowed bg-gray-700 border-gray-600 text-gray-400'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-600 border-blue-400 text-white hover:from-blue-400 hover:to-cyan-500 hover:border-blue-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] active:scale-95'
                }`}
              >
                <SkipForward size={16} className="sm:w-5 sm:h-5 mr-2" />
                STEP
              </GameButton>
            )}
            {onReset && (
              <GameButton
                onClick={onReset}
                className="text-xs sm:text-sm py-2 sm:py-3 px-3 sm:px-4 font-bold border-2 bg-gradient-to-r from-red-500 to-red-700 border-red-400 text-white hover:from-red-400 hover:to-red-600 hover:border-red-300 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all duration-300 rounded-sm min-h-[44px] touch-manipulation active:scale-95"
              >
                <RotateCcw size={16} className="sm:w-5 sm:h-5 mr-2" />
                RESET
              </GameButton>
            )}
          </div>
        </div>

        {/* Action Buttons - Full width, touch-friendly */}
        <div className="space-y-2">
          {onExport && (
            <GameButton
              onClick={onExport}
              className="w-full text-xs sm:text-sm py-2 sm:py-3 px-3 sm:px-4 font-bold border-2 bg-gradient-to-r from-indigo-500 to-purple-600 border-indigo-400 text-white hover:from-indigo-400 hover:to-purple-500 hover:border-indigo-300 hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all duration-300 rounded-sm min-h-[44px] touch-manipulation active:scale-95"
            >
              <Download size={16} className="sm:w-5 sm:h-5 mr-2" />
              EXPORT
            </GameButton>
          )}

          {onSaveReplay && (
            <GameButton
              onClick={onSaveReplay}
              className="w-full text-xs sm:text-sm py-2 sm:py-3 px-3 sm:px-4 font-bold border-2 bg-gradient-to-r from-purple-500 to-purple-700 border-purple-400 text-white hover:from-purple-400 hover:to-purple-600 hover:border-purple-300 hover:shadow-[0_0_15px_rgba(147,51,234,0.4)] transition-all duration-300 rounded-sm min-h-[44px] touch-manipulation active:scale-95"
            >
              <Save size={16} className="sm:w-5 sm:h-5 mr-2" />
              SAVE REPLAY
            </GameButton>
          )}
        </div>
      </div>
    </GamePanel>
  );
}

