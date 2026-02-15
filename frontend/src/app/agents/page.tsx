"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { AgentSummary } from "@/lib/types";
import { GamePanel, GameButton, StatDisplay, AgentCard } from "@/components/GameUI";
import { Shield, Sword, Ghost, Zap, ArrowLeft, Brain, Crosshair, AlertTriangle } from "lucide-react";

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [simulationId] = useState<string>("default");

  useEffect(() => {
    const loadAgents = async () => {
      try {
        // In a real app, this would be the active simulation
        // For now, we'll load from a default simulation
        const agentsData = await apiClient.getAgents(simulationId);
        setAgents(agentsData);
      } catch (error) {
        console.error("Failed to load agents:", error);
        // For development, use mock data if API fails
        setAgents([
          {
            agent_id: 0,
            strategy: "greedy",
            resources: 45,
            strength: 8,
            alive: true,
            trust: 0.7,
            aggression: 0.2,
            rank: 1,
            health: 100,
            kills: 2
          },
          {
            agent_id: 1,
            strategy: "cheater",
            resources: 32,
            strength: 6,
            alive: true,
            trust: 0.3,
            aggression: 0.8,
            rank: 2,
            health: 85,
            kills: 1
          },
          {
            agent_id: 2,
            strategy: "warlord",
            resources: 28,
            strength: 9,
            alive: true,
            trust: 0.1,
            aggression: 0.9,
            rank: 3,
            health: 70,
            kills: 5
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadAgents();
  }, [simulationId]);

  const strategies = [
    {
      type: "greedy",
      icon: <Shield className="text-blue-400" size={24} />,
      title: "THE ALTRUIST",
      philosophy: "Kant's Categorical Imperative",
      desc: "Believes in the social contract. Prioritizes resource gathering (Work) over theft. Will only fight in self-defense or to punish those with low reputation (Justice).",
      weakness: "Vulnerable to exploitation by free-riders.",
      stats: { str: 2, def: 8, aggro: 1 },
      color: "border-blue-500 text-blue-400",
      bg: "bg-blue-950/40",
      quote: "\"If everyone cheats, we all starve.\""
    },
    {
      type: "warlord",
      icon: <Sword className="text-red-400" size={24} />,
      title: "THE WARLORD",
      philosophy: "Hobbesian Trap / Might makes Right",
      desc: "Views the simulation as a zero-sum conflict. Actively hunts weaker neighbors to eliminate competition and loot tokens. Does not fear reputation loss.",
      weakness: "High mortality rate due to constant combat.",
      stats: { str: 9, def: 3, aggro: 10 },
      color: "border-red-600 text-red-400",
      bg: "bg-red-950/40",
      quote: "\"Peace is just a pause between wars.\""
    },
    {
      type: "cheater",
      icon: <Ghost className="text-purple-400" size={24} />,
      title: "THE PARASITE",
      philosophy: "Machiavellian Intelligence",
      desc: "Calculates the risk/reward ratio of theft vs work. Prefers to steal from wealthy agents when the chance of being caught is low. Avoids fair fights.",
      weakness: "Low defense; crumbles when targeted directly.",
      stats: { str: 4, def: 4, aggro: 5 },
      color: "border-purple-500 text-purple-400",
      bg: "bg-purple-950/40",
      quote: "\"Why work when you can take?\""
    },
    {
      type: "politician",
      icon: <Zap className="text-orange-400" size={24} />,
      title: "THE POLITICIAN",
      philosophy: "Control governance & alliances",
      desc: "Focuses on manipulating the rule system and forming alliances. Uses governance mechanics to create favorable conditions for survival.",
      weakness: "Depends heavily on social dynamics and rule changes.",
      stats: { str: 5, def: 5, aggro: 3 },
      color: "border-orange-500 text-orange-400",
      bg: "bg-orange-950/40",
      quote: "\"Power is not taken, it's given.\""
    }
  ];

  const filtered = selectedStrategy
    ? agents.filter((a) => a.strategy === selectedStrategy)
    : agents;

  const sortedByResources = [...filtered].sort((a, b) => b.resources - a.resources);

  return (
    <div className="h-full w-full p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8 md:mb-12 border-b border-slate-800 pb-4 sm:pb-6">
            <div>
                <Link href="/" className="mb-2 sm:mb-4 text-slate-500 hover:text-white flex items-center gap-2 font-mono text-xs sm:text-sm transition-colors">
                    <ArrowLeft size={14} className="sm:w-4 sm:h-4" /> BACK TO MENU
                </Link>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-pixel text-yellow-500 tracking-tight">
                    AGENT <span className="text-white">ARCHETYPES</span>
                </h2>
            </div>
            <div className="hidden sm:block text-right">
                <div className="text-xs font-mono text-slate-500">SUBJECT ANALYSIS</div>
                <div className="text-xs font-mono text-yellow-500">CLASSIFIED</div>
            </div>
        </div>

        {/* Strategy Filter */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedStrategy(null)}
              className={`px-3 sm:px-4 py-2 rounded font-mono text-xs sm:text-sm transition-colors ${
                selectedStrategy === null
                  ? "bg-yellow-500 text-black"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              ALL STRATEGIES
            </button>
            {strategies.map((strat) => (
              <button
                key={strat.type}
                onClick={() => setSelectedStrategy(strat.type)}
                className={`px-3 sm:px-4 py-2 rounded font-mono text-xs sm:text-sm transition-colors ${
                  selectedStrategy === strat.type
                    ? "bg-yellow-500 text-black"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {strat.type.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
            {strategies
              .filter(strat => !selectedStrategy || strat.type === selectedStrategy)
              .map((strat) => (
                <div key={strat.type} className={`relative overflow-hidden rounded-xl border-2 ${strat.color.split(' ')[0]} ${strat.bg} p-1 shadow-2xl transition-transform hover:scale-[1.01] duration-300`}>

                    {/* Background Noise/Decoration */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

                    <div className="flex flex-col h-full bg-slate-900/80 rounded-lg p-4 sm:p-6 relative z-10">

                        {/* Top Section: Avatar & Title */}
                        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 mb-4 sm:mb-6">
                            <div className={`shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-lg border-2 ${strat.color.split(' ')[0]} bg-slate-950 shadow-inner overflow-hidden`}>
                                <img
                                    src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${strat.type}`}
                                    alt="avatar"
                                    className="w-full h-full object-cover image-pixelated hover:scale-110 transition-transform duration-500"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    {strat.icon}
                                    <h3 className={`font-pixel text-lg sm:text-xl ${strat.color.split(' ')[1]}`}>{strat.type.toUpperCase()}</h3>
                                </div>
                                <h4 className="text-white font-bold text-base sm:text-lg tracking-wide mb-1">{strat.title}</h4>
                                <div className="flex items-center gap-2 text-xs font-mono text-slate-400 italic mb-3 sm:mb-4">
                                    <Brain size={12} /> {strat.philosophy}
                                </div>
                                <div className="bg-black/30 p-2 sm:p-3 rounded border-l-2 border-slate-600">
                                    <p className="font-serif text-slate-300 italic text-sm">{strat.quote}</p>
                                </div>
                            </div>
                        </div>

                        {/* Middle Section: Stats Bars */}
                        <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 font-mono text-xs">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <span className="w-10 sm:w-12 text-slate-400">STR</span>
                                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-red-500" style={{ width: `${strat.stats.str * 10}%` }}></div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-4">
                                <span className="w-10 sm:w-12 text-slate-400">DEF</span>
                                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{ width: `${strat.stats.def * 10}%` }}></div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-4">
                                <span className="w-10 sm:w-12 text-slate-400">AGGRO</span>
                                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-yellow-500" style={{ width: `${strat.stats.aggro * 10}%` }}></div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Section: Description & Weakness */}
                        <div className="mt-auto space-y-3 sm:space-y-4">
                             <div>
                                <h5 className="text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center gap-1">
                                    <Crosshair size={10} /> Behavioral Pattern
                                </h5>
                                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                    {strat.desc}
                                </p>
                             </div>

                             <div className="bg-red-900/20 border border-red-900/50 p-2 sm:p-3 rounded">
                                <h5 className="text-[10px] uppercase font-bold text-red-400 mb-1 flex items-center gap-1">
                                    <AlertTriangle size={10} /> Critical Weakness
                                </h5>
                                <p className="text-xs sm:text-sm text-red-200/70">
                                    {strat.weakness}
                                </p>
                             </div>
                        </div>

                    </div>
                </div>
            ))}
        </div>

        {/* Live Agent Instances */}
        {agents.length > 0 && (
          <div className="border-t border-slate-800 pt-6 sm:pt-8">
            <h3 className="text-xl sm:text-2xl text-white font-bold mb-4 sm:mb-6">LIVE AGENTS</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {sortedByResources.slice(0, 12).map((agent, idx) => (
                <Link key={agent.agent_id} href={`/agents/${agent.agent_id}`}>
                  <AgentCard agent={agent} rank={idx + 1} />
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

