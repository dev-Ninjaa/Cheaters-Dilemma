import { ReactNode } from "react";
import {
  GameButtonProps,
  StatDisplayProps,
  AgentCardProps,
  EventLogEntry,
  EventLogProps,
} from "@/lib/types";

interface GamePanelProps {
  title?: string;
  children: ReactNode;
  className?: string;
  neon?: boolean;
  variant?: "blue" | "red" | "green" | "yellow";
}

export function GamePanel({
  title,
  children,
  className = "",
  neon = false,
  variant = "blue",
}: GamePanelProps) {
  let variantClass = "border-slate-700";
  let titleClass = "text-white";

  if (variant === "blue") {
    variantClass = "border-blue-600/60 bg-blue-950/20";
    titleClass = "text-blue-400";
  } else if (variant === "red") {
    variantClass = "border-red-600/60 bg-red-950/20";
    titleClass = "text-red-400";
  } else if (variant === "green") {
    variantClass = "border-green-600/60 bg-green-950/20";
    titleClass = "text-green-400";
  } else if (variant === "yellow") {
    variantClass = "border-yellow-600/60 bg-yellow-950/20";
    titleClass = "text-yellow-500";
  }

  return (
    <div className={`retro-panel ${variantClass} ${className}`}>
      {title && (
        <div
          className={`border-b border-slate-700 px-4 py-3 mb-3 ${titleClass}`}
        >
          <h3 className="retro-subtitle uppercase font-bold tracking-widest font-pixel text-sm">
            [ {title} ]
          </h3>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

export function GameButton({
  children,
  className = "",
  onClick,
  disabled = false,
}: GameButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`retro-button ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      {children}
    </button>
  );
}

export function StatDisplay({
  label,
  value,
  unit = "",
  className = "",
}: StatDisplayProps) {
  return (
    <div className={`mb-4 ${className}`}>
      <div className="stat-label mb-1">{label}</div>
      <div className="stat-value">
        {value} <span className="text-xs text-slate-400">{unit}</span>
      </div>
    </div>
  );
}

export function AgentCard({ agent, rank }: AgentCardProps) {
  return (
    <div className="retro-panel border-slate-700 mb-3 hover:border-slate-600">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-lg font-bold text-yellow-500 font-pixel">
          #{rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white truncate">
            {agent.name || `Agent ${agent.agent_id !== undefined ? agent.agent_id : (agent.id !== undefined ? agent.id : 'undefined')}`}
          </div>
          <div className="text-xs text-slate-400 truncate">{(agent.type || agent.strategy || "agent").toUpperCase()}</div>
        </div>
      </div>
      <div className="space-y-2 text-xs font-mono">
        <div className="flex justify-between items-center min-w-0">
          <span className="text-slate-400 flex-shrink-0">RESOURCE:</span>
          <span className="text-white font-bold truncate ml-2">{agent.resources || 0}</span>
        </div>
        <div className="flex justify-between items-center min-w-0">
          <span className="text-slate-400 flex-shrink-0">STRENGTH:</span>
          <span className="text-white font-bold truncate ml-2">{agent.strength || 0}</span>
        </div>
        <div className="flex justify-between items-center min-w-0">
          <span className="text-slate-400 flex-shrink-0">TRUST:</span>
          <span className="text-white font-bold truncate ml-2">
            {typeof agent.trust === "number"
              ? agent.trust.toFixed(2)
              : agent.trust}
          </span>
        </div>
      </div>
    </div>
  );
}

export function EventLog({ events, maxHeight = "h-64" }: EventLogProps) {
  return (
    <div
      className={`retro-panel ${maxHeight} overflow-y-auto`}
      style={{
        background:
          "linear-gradient(to bottom, rgba(30, 41, 59, 0.3), rgba(15, 23, 42, 0.2))",
      }}
    >
      {events && events.length > 0 ? (
        <div className="space-y-2 text-xs font-mono">
          {events.map((event: EventLogEntry, idx: number) => (
            <div
              key={idx}
              className="text-slate-300 border-l-2 border-slate-600 pl-2 py-1"
            >
              <span className="text-slate-500">[{event.turn ?? "?"}]</span>{" "}
              {event.message || event.type}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-slate-500 opacity-50 text-center py-8 font-mono">
          &gt; NO EVENTS &lt;
        </div>
      )}
    </div>
  );
}

