"use client";

import React from 'react';
import { AgentSummary, AgentDetail } from '@/lib/types';
import { Shield, Sword, Heart, Trophy, Skull, Swords, Footprints, HandCoins, ShieldPlus, Target, TrendingUp, TrendingDown } from 'lucide-react';

interface AgentCardProps {
  agent: AgentSummary | AgentDetail | null;
  recentEvents?: Array<{
    turn: number;
    actor: number;
    action: string;
    target: number | null;
    outcome: string;
  }>;
}

const AVATAR_API_BASE = "https://api.dicebear.com/7.x/pixel-art/svg?seed=";

const STRATEGY_COLORS = {
  HONEST: 'border-blue-500',
  AGGRESSIVE: 'border-red-600',
  DECEPTIVE: 'border-purple-500',
  CHAOTIC: 'border-orange-500'
};

const AgentCard: React.FC<AgentCardProps> = ({ agent, recentEvents = [] }) => {
  if (!agent) {
    return (
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 h-full flex items-center justify-center text-slate-500 text-sm italic">
        Select an agent to view details
      </div>
    );
  }

  // Check if this is an AgentDetail with additional metrics
  const isAgentDetail = (agent: AgentSummary | AgentDetail): agent is AgentDetail => {
    return 'total_actions' in agent;
  };

  const agentDetail = isAgentDetail(agent) ? agent : null;

  // Find the most recent action for this agent
  const recentAction = recentEvents
    .filter(event => event.actor === agent.agent_id)
    .sort((a, b) => b.turn - a.turn)[0];

  const getActionDescription = (action: string, target: number | null, outcome: string) => {
    switch (action.toLowerCase()) {
      case 'work':
        return outcome.includes('success') ? 'Working honestly' : 'Attempting to work';
      case 'steal':
        return target ? `Stealing from Agent ${target}!` : 'Attempting theft';
      case 'attack':
        return target ? `Attacking Agent ${target}!` : 'Engaging in combat';
      case 'vote':
        return 'Participating in governance';
      default:
        return 'Active in simulation';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'attack': return <Swords size={14} className="text-red-500" />;
      case 'steal': return <HandCoins size={14} className="text-yellow-500" />;
      case 'work': return <ShieldPlus size={14} className="text-green-500" />;
      case 'vote': return <Trophy size={14} className="text-blue-500" />;
      default: return <Footprints size={14} className="text-slate-400" />;
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
    <div className={`bg-slate-800 p-4 rounded-lg border-2 ${agent.alive ? getStrategyColor(agent.strategy) : 'border-gray-600'} shadow-lg transition-all`}>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 bg-slate-900 rounded-lg overflow-hidden border border-slate-600">
          <img
            src={`${AVATAR_API_BASE}${agent.agent_id}`}
            alt={`Agent ${agent.agent_id}`}
            className={`w-full h-full object-cover pixelated ${!agent.alive ? 'grayscale opacity-50' : ''}`}
          />
        </div>
        <div>
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            Agent {agent.agent_id}
            {!agent.alive && <Skull size={16} className="text-gray-400" />}
          </h3>
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
            {agent.strategy} CLASS
          </div>
          <div className="text-xs text-yellow-400 font-bold mt-1">
            TOKENS: {Math.floor(agent.resources)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-slate-900/50 p-2 rounded flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1"><Heart size={12}/> HP</span>
          <span className={`${agent.health < 15 ? 'text-red-500' : 'text-green-400'} font-mono`}>
            {agent.health}/50
          </span>
        </div>
        <div className="bg-slate-900/50 p-2 rounded flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1"><Trophy size={12}/> KILLS</span>
          <span className="text-white font-mono">{agent.kills}</span>
        </div>
        <div className="bg-slate-900/50 p-2 rounded flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1"><Sword size={12}/> STRENGTH</span>
          <span className="text-white font-mono">{agent.strength.toFixed(1)}</span>
        </div>
        <div className="bg-slate-900/50 p-2 rounded flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1"><Shield size={12}/> AGGRESSION</span>
          <span className="text-white font-mono">{agent.aggression.toFixed(2)}</span>
        </div>
      </div>

      {/* Additional Metrics for AgentDetail */}
      {agentDetail && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <div className="text-xs text-slate-400 mb-2 font-bold uppercase tracking-wider">ACTION STATISTICS</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-slate-900/50 p-2 rounded flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1"><Target size={12}/> TOTAL</span>
              <span className="text-white font-mono">{agentDetail.total_actions}</span>
            </div>
            <div className="bg-slate-900/50 p-2 rounded flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1"><TrendingUp size={12}/> SUCCESS</span>
              <span className="text-green-400 font-mono">{agentDetail.successful_actions}</span>
            </div>
            <div className="bg-slate-900/50 p-2 rounded flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1"><TrendingDown size={12}/> FAILED</span>
              <span className="text-red-400 font-mono">{agentDetail.failed_actions}</span>
            </div>
            <div className="bg-slate-900/50 p-2 rounded flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">RANK</span>
              <span className="text-yellow-400 font-mono">#{agentDetail.rank || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="text-xs text-slate-400 mb-1 flex items-center gap-2">
          CURRENT STATUS
          {recentAction && getActionIcon(recentAction.action)}
        </div>
        <div className="text-sm text-white">
          {agent.alive ? (
             <span className="italic">
               {recentAction ? getActionDescription(recentAction.action, recentAction.target, recentAction.outcome) : 'Active in simulation'}
             </span>
          ) : (
            <span className="text-red-500 font-bold">ELIMINATED</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentCard;

