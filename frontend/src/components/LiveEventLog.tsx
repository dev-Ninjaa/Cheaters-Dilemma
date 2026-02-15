"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EventLogEntry } from "@/lib/types";

interface LiveEventLogProps {
  events: EventLogEntry[];
  maxHeight?: string;
  live?: boolean;
}

export function LiveEventLog({ events, maxHeight = "h-64", live = false }: LiveEventLogProps) {
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [agentFilter, setAgentFilter] = useState("ALL");
  const [followTail, setFollowTail] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const actionOptions = useMemo(() => {
    return Array.from(
      new Set(
        events
          .map((event) => event.action?.toUpperCase())
          .filter((action): action is string => Boolean(action))
      )
    ).sort();
  }, [events]);

  const agentOptions = useMemo(() => {
    const ids = new Set<number>();
    for (const event of events) {
      if (typeof event.actor === "number") ids.add(event.actor);
      if (typeof event.target === "number") ids.add(event.target);
    }
    return Array.from(ids).sort((a, b) => a - b);
  }, [events]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (actionFilter !== "ALL") {
        const eventAction = event.action?.toUpperCase() || "UNKNOWN";
        if (eventAction !== actionFilter) return false;
      }

      if (agentFilter !== "ALL") {
        const agentId = Number(agentFilter);
        if (event.actor !== agentId && event.target !== agentId) return false;
      }

      if (normalizedQuery.length > 0) {
        const searchable = `${event.message} ${event.action ?? ""} ${event.actor ?? ""} ${event.target ?? ""}`.toLowerCase();
        if (!searchable.includes(normalizedQuery)) return false;
      }

      return true;
    });
  }, [events, actionFilter, agentFilter, normalizedQuery]);

  useEffect(() => {
    if (!followTail) return;
    const node = containerRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [filteredEvents.length, followTail]);

  const toggleFollowTail = () => {
    setFollowTail((prev) => {
      const next = !prev;
      if (next && containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
      return next;
    });
  };

  const handleScroll = () => {
    if (!followTail || !containerRef.current) return;
    const node = containerRef.current;
    const nearBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 12;
    if (!nearBottom) {
      setFollowTail(false);
    }
  };

  return (
    <div>
      <div className="mb-2 space-y-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events..."
            className="flex-1 bg-[#1a1f2e] border border-[#94a3b8] text-[#eab308] px-2 py-1 focus:outline-none focus:border-[#475569]"
          />
          <button
            type="button"
            onClick={toggleFollowTail}
            className={`px-2 py-1 border text-[10px] tracking-wide ${
              followTail
                ? "border-[#eab308] text-[#eab308]"
                : "border-[#475569] text-[#475569]"
            }`}
          >
            {followTail ? "FOLLOW ON" : "FOLLOW OFF"}
          </button>
          {live && (
            <span className="px-2 py-1 border border-[#00ff66] text-[#00ff66] text-[10px] tracking-wide">
              LIVE
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-[#1a1f2e] border border-[#94a3b8] text-[#eab308] px-2 py-1"
          >
            <option value="ALL">ALL ACTIONS</option>
            {actionOptions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="bg-[#1a1f2e] border border-[#94a3b8] text-[#eab308] px-2 py-1"
          >
            <option value="ALL">ALL AGENTS</option>
            {agentOptions.map((agentId) => (
              <option key={agentId} value={String(agentId)}>
                AGENT {agentId}
              </option>
            ))}
          </select>
        </div>
        <div className="text-[10px] text-[#94a3b8] opacity-75">
          SHOWING {filteredEvents.length} / {events.length}
        </div>
      </div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={`retro-panel ${maxHeight} overflow-y-auto`}
        style={{
          background: "linear-gradient(to bottom, rgba(0, 255, 255, 0.02), rgba(255, 0, 255, 0.01))",
        }}
      >
        {filteredEvents.length > 0 ? (
          <div className="space-y-2 text-xs font-mono">
            {filteredEvents.map((event, idx) => (
              <div
                key={`${event.turn}-${event.action ?? "event"}-${event.actor ?? "x"}-${event.target ?? "x"}-${idx}`}
                className="text-[#94a3b8] border-l-2 border-[#475569] pl-2 py-1"
              >
                <span className="text-[#475569]">[{event.turn ?? "?"}]</span> {event.narrative || event.message || event.type}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[#94a3b8] opacity-50 text-center py-8">
            &gt; NO EVENTS &lt;
          </div>
        )}
      </div>
    </div>
  );
}

