"use client";

import React, { useState, useEffect } from 'react';
import { AgentSummary } from '@/lib/types';
import { Skull, Swords, Footprints, HandCoins, ShieldPlus, Trophy } from 'lucide-react';


export const AVATAR_API_BASE = "https://api.dicebear.com/7.x/pixel-art/svg?seed=";
interface Position {
  x: number;
  y: number;
}

interface GameBoardProps {
  agents: AgentSummary[];
  onAgentClick: (agent: AgentSummary) => void;
  selectedAgentId: number | null;
  showInteractions?: boolean;
  agentCount?: number;
  seed?: number;
  recentEvents?: Array<{
    turn: number;
    actor: number;
    action: string;
    target: number | null;
    outcome: string;
    narrative?: string;
  }>;
}

const GRID_SIZE = 15;

const STRATEGY_COLORS = {
  HONEST: 'border-blue-500',
  AGGRESSIVE: 'border-red-600',
  DECEPTIVE: 'border-purple-500',
  CHAOTIC: 'border-orange-500'
};

const GameBoard: React.FC<GameBoardProps> = ({
  agents,
  onAgentClick,
  selectedAgentId,
  showInteractions = false,
  agentCount = 10,
  seed = 42,
  recentEvents = []
}) => {
  // Filter only alive agents
  const aliveAgents = agents.filter(agent => agent.alive);

  // Responsive grid size state
  const [gridSize, setGridSize] = useState(15);

  // Responsive grid size calculation
  const getGridSize = () => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 640) return 10; // Mobile
      if (width < 1024) return 12; // Tablet
      return 15; // Desktop
    }
    return 15; // Default
  };

  // Update grid size on mount and resize
  useEffect(() => {
    const updateGridSize = () => setGridSize(getGridSize());
    updateGridSize();
    window.addEventListener('resize', updateGridSize);
    return () => window.removeEventListener('resize', updateGridSize);
  }, []);

  const GRID_SIZE = gridSize;

  // Simple seeded random number generator
  const seededRandom = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return () => {
      hash = (hash * 9301 + 49297) % 233280;
      return hash / 233280;
    };
  };

  // Generate dynamic position for agent based on their actions
  const getAgentPosition = (agent: AgentSummary): Position => {
    // Base position from seed
    const baseRng = seededRandom(`${seed}-${agent.agent_id}`);
    const baseX = Math.floor(baseRng() * GRID_SIZE);
    const baseY = Math.floor(baseRng() * GRID_SIZE);

    // Find recent actions to determine movement
    const recentActions = recentEvents.filter(event => event.actor === agent.agent_id);
    const actionCount = recentActions.length;

    if (actionCount === 0) return { x: baseX, y: baseY };

    // Get the most recent action
    const lastAction = recentActions[recentActions.length - 1];

    // Movement based on action type
    let moveX = 0;
    let moveY = 0;

    switch (lastAction.action.toLowerCase()) {
      case 'attack':
        // Move towards target if attacking
        if (lastAction.target) {
          // Simple directional movement towards target area
          const targetRng = seededRandom(`${seed}-${lastAction.target}`);
          const targetX = Math.floor(targetRng() * GRID_SIZE);
          const targetY = Math.floor(targetRng() * GRID_SIZE);
          moveX = targetX > baseX ? 1 : targetX < baseX ? -1 : 0;
          moveY = targetY > baseY ? 1 : targetY < baseY ? -1 : 0;
        }
        break;
      case 'steal':
        // Move away from target if stealing
        if (lastAction.target) {
          const targetRng = seededRandom(`${seed}-${lastAction.target}`);
          const targetX = Math.floor(targetRng() * GRID_SIZE);
          const targetY = Math.floor(targetRng() * GRID_SIZE);
          moveX = targetX > baseX ? -1 : targetX < baseX ? 1 : 0;
          moveY = targetY > baseY ? -1 : targetY < baseY ? 1 : 0;
        }
        break;
      case 'work':
        // Stay relatively still when working
        const workRng = seededRandom(`${seed}-${agent.agent_id}-work-${actionCount}`);
        moveX = Math.floor(workRng() * 3) - 1;
        moveY = Math.floor(workRng() * 3) - 1;
        break;
      case 'vote':
        // Move towards center when voting (governance)
        const centerX = Math.floor(GRID_SIZE / 2);
        const centerY = Math.floor(GRID_SIZE / 2);
        moveX = baseX < centerX ? 1 : baseX > centerX ? -1 : 0;
        moveY = baseY < centerY ? 1 : baseY > centerY ? -1 : 0;
        break;
      default:
        // Random movement for other actions
        const movementRng = seededRandom(`${seed}-${agent.agent_id}-${actionCount}`);
        moveX = Math.floor(movementRng() * 3) - 1;
        moveY = Math.floor(movementRng() * 3) - 1;
    }

    // Calculate new position with bounds checking
    const newX = Math.max(0, Math.min(GRID_SIZE - 1, baseX + moveX));
    const newY = Math.max(0, Math.min(GRID_SIZE - 1, baseY + moveY));

    return { x: newX, y: newY };
  };

  // Create grid cells
  const cells = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      cells.push({ x, y });
    }
  }

  // Find agent at position (only alive agents)
  const getAgentAt = (pos: Position) => {
    return aliveAgents.find(agent => {
      const agentPos = getAgentPosition(agent);
      return agentPos.x === pos.x && agentPos.y === pos.y;
    }) || null;
  };

  const getActionIcon = (agent: AgentSummary) => {
    // Find the most recent action for this agent
    const recentAction = recentEvents
      .filter(event => event.actor === agent.agent_id)
      .sort((a, b) => b.turn - a.turn)[0];

    const iconSize = GRID_SIZE <= 10 ? 10 : GRID_SIZE <= 12 ? 12 : 14;

    if (!recentAction) {
      // Fallback to aggression-based icons
      if (agent.aggression > 0.7) return <Swords size={iconSize} className="text-red-500 animate-pulse" />;
      if (agent.resources > 50) return <HandCoins size={iconSize} className="text-yellow-500" />;
      if (agent.strength > 50) return <ShieldPlus size={iconSize} className="text-green-500" />;
      return <Footprints size={iconSize} className="text-slate-400" />;
    }

    switch (recentAction.action.toLowerCase()) {
      case 'attack': return <Swords size={iconSize} className="text-red-500 animate-pulse drop-shadow-lg" />;
      case 'steal': return <HandCoins size={iconSize} className="text-yellow-500 animate-bounce drop-shadow-lg" />;
      case 'work': return <ShieldPlus size={iconSize} className="text-green-500 animate-pulse drop-shadow-lg" />;
      case 'vote': return <Trophy size={iconSize} className="text-blue-500 animate-bounce drop-shadow-lg" />;
      default: return <Footprints size={iconSize} className="text-slate-400 drop-shadow-lg" />;
    }
  };

  const getActionDetails = (agent: AgentSummary) => {
    const recentAction = recentEvents
      .filter(event => event.actor === agent.agent_id)
      .sort((a, b) => b.turn - a.turn)[0];

    if (!recentAction) return null;

    // Show just the action on the agent's head
    return recentAction.action.toUpperCase();
  };

  const getInteractionColor = (action: string) => {
    switch(action.toLowerCase()) {
        case 'attack': return 'text-red-300 bg-red-900/90 border-red-500 shadow-red-500/50';
        case 'steal': return 'text-yellow-300 bg-yellow-900/90 border-yellow-500 shadow-yellow-500/50';
        case 'work': return 'text-green-300 bg-green-900/90 border-green-500 shadow-green-500/50';
        case 'vote': return 'text-blue-300 bg-blue-900/90 border-blue-500 shadow-blue-500/50';
        default: return 'text-slate-200 bg-slate-900/90 border-slate-500 shadow-slate-500/50';
    }
  };

  const getStrategyColor = (strategy: string) => {
    switch(strategy.toLowerCase()) {
      case 'honest': return 'border-blue-500';
      case 'aggressive': return 'border-red-600';
      case 'deceptive': return 'border-purple-500';
      case 'chaotic': return 'border-orange-500';
      default: return 'border-slate-500';
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-xs sm:text-sm text-slate-400 font-mono text-center">
        Agents: {aliveAgents.length}/{agentCount} alive | Seed: {seed}
      </div>
      <div
        className="grid gap-0.5 sm:gap-1 bg-slate-800 p-1 sm:p-2 rounded-lg border-2 border-slate-700 shadow-2xl overflow-hidden w-full max-w-4xl mx-auto touch-manipulation"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
          aspectRatio: '1/1',
          maxWidth: GRID_SIZE <= 10 ? '300px' : GRID_SIZE <= 12 ? '400px' : '600px',
          maxHeight: GRID_SIZE <= 10 ? '300px' : GRID_SIZE <= 12 ? '400px' : '600px'
        }}
      >
      {cells.map((cell) => {
        const agent = getAgentAt(cell);
        const isSelected = agent && agent.agent_id === selectedAgentId;

        return (
          <div
            key={`${cell.x}-${cell.y}`}
            className={`
              relative bg-slate-900/50 rounded-sm border border-slate-800/50
              flex items-center justify-center transition-all duration-500 ease-in-out
              ${agent ? 'cursor-pointer hover:bg-slate-800' : ''}
              ${isSelected ? 'ring-2 ring-yellow-400 z-10' : ''}
              ${agent && recentEvents.some(e => e.actor === agent.agent_id) ? 'shadow-lg shadow-blue-500/20' : ''}
            `}
            onClick={() => agent && onAgentClick(agent)}
          >
            {agent && (
              <div className="relative w-full h-full p-0.5 group">
                {/* Agent Avatar */}
                <div className={`w-full h-full rounded overflow-hidden border-2 ${getStrategyColor(agent.strategy)} bg-slate-950 ${recentEvents.some(e => e.actor === agent.agent_id) ? 'animate-pulse shadow-inner shadow-blue-400/30' : ''}`}>
                   <img
                    src={`${AVATAR_API_BASE}${agent.agent_id}`}
                    alt={`Agent ${agent.agent_id}`}
                    className="w-full h-full object-cover pixelated"
                   />
                </div>

                {/* Status Overlay (HP Bar) */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-700">
                    <div
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${Math.min(100, (agent.resources / 100) * 100)}%` }}
                    />
                </div>

                {/* Action Bubble Icon */}
                {(() => {
                  const recentAction = recentEvents
                    .filter(event => event.actor === agent.agent_id)
                    .sort((a, b) => b.turn - a.turn)[0];
                  return recentAction ? (
                    <div className="absolute -top-3 -right-3 bg-slate-900 rounded-full p-1 border-2 border-slate-600 z-20 shadow-xl animate-pulse">
                        {getActionIcon(agent)}
                    </div>
                  ) : null;
                })()}

                {/* Interaction Details Bubble */}
                {showInteractions && (() => {
                  const actionDetails = getActionDetails(agent);
                  const recentAction = recentEvents
                    .filter(event => event.actor === agent.agent_id)
                    .sort((a, b) => b.turn - a.turn)[0];
                  return actionDetails && recentAction ? (
                    <div className={`
                        absolute -top-6 sm:-top-8 left-1/2 -translate-x-1/2 whitespace-nowrap z-30
                        px-1 sm:px-2 py-0.5 sm:py-1 rounded-md text-[8px] sm:text-[10px] font-bold border-2 shadow-xl pointer-events-none
                        animate-fade-in-up backdrop-blur-sm
                        ${getInteractionColor(recentAction.action)}
                    `}>
                        {actionDetails}
                    </div>
                  ) : null;
                })()}

                {/* Score Tag */}
                <div className="absolute top-0 left-0 bg-black/60 text-[6px] sm:text-[8px] text-white px-0.5 sm:px-1 rounded-br backdrop-blur-sm font-mono">
                    {Math.floor(agent.resources)}
                </div>
              </div>
            )}

            {/* Render Dead Bodies */}
            {!agent && (() => {
              const deadAgent = agents.find(a => !a.alive && getAgentPosition(a).x === cell.x && getAgentPosition(a).y === cell.y);
              const skullSize = GRID_SIZE <= 10 ? 12 : GRID_SIZE <= 12 ? 16 : 18;
              return deadAgent ? (
                <div className="opacity-40 grayscale animate-pulse">
                  <Skull size={skullSize} className="text-slate-500 drop-shadow-sm" />
                </div>
              ) : null;
            })()}

          </div>
        );
      })}
    </div>
    </div>
  );
};

export default GameBoard;

