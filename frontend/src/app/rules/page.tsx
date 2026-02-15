"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { Ruleset, RuleHistory } from "@/lib/types";
import { GamePanel, GameButton, StatDisplay } from "@/components/GameUI";
import { ArrowLeft, Target, Heart, Footprints, HandCoins, Crown, Scale, AlertOctagon, HelpCircle, Zap } from "lucide-react";

export default function RulesPage() {
  const [ruleset, setRuleset] = useState<Ruleset | null>(null);
  const [history, setHistory] = useState<RuleHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulationId] = useState("default");

  useEffect(() => {
    const loadRules = async () => {
      try {
        const rulesData = await apiClient.getCurrentRules(simulationId);
        setRuleset(rulesData);
        const historyData = await apiClient.getRulesHistory(simulationId);
        setHistory(historyData);
      } catch (error) {
        console.error("Failed to load rules:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRules();
  }, [simulationId]);

  const ruleCategories = ruleset
    ? {
        economy: Object.entries(ruleset.rules)
          .filter(([k]) => k.includes("steal") || k.includes("resource") || k.includes("work"))
          .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {}),
        violence: Object.entries(ruleset.rules)
          .filter(([k]) => k.includes("attack") || k.includes("kill") || k.includes("strength"))
          .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {}),
        governance: Object.entries(ruleset.rules)
          .filter(([k]) => k.includes("vote") || k.includes("proposal") || k.includes("power"))
          .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {}),
      }
    : { economy: {}, violence: {}, governance: {} };

  return (
    <div className="h-full w-full p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full">

        <Link href="/" className="mb-8 text-slate-500 hover:text-white flex items-center gap-2 font-mono text-sm transition-colors">
            <ArrowLeft size={16} /> BACK TO MENU
        </Link>

        <div className="border-b border-slate-700 pb-6 mb-12">
            <h2 className="text-4xl md:text-5xl font-pixel text-green-500 mb-2">
                SYSTEM <span className="text-white">RULES</span>
            </h2>
            <p className="font-mono text-slate-500 text-lg uppercase tracking-wider">
                & The Emergent Meta-Game
            </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 font-mono text-slate-300">

            {/* Left Col: Core Mechanics */}
            <div className="lg:col-span-7 space-y-10">

                <section>
                    <h3 className="text-2xl text-white font-bold mb-6 flex items-center gap-3">
                        <Crown className="text-yellow-500" /> VICTORY CONDITIONS
                    </h3>
                    <div className="bg-slate-900 p-6 rounded border border-slate-700 space-y-4 shadow-lg">
                        <p className="leading-relaxed">
                            The simulation operates on a <span className="text-yellow-400">Score Accumulation</span> basis.
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-sm text-slate-400 ml-2">
                            <li>First agent to reach <span className="text-white font-bold">100 POINTS</span> triggers Game Over.</li>
                            <li>If only one agent remains alive (Last Man Standing), they win regardless of score.</li>
                            <li>Scores are accumulated by <span className="text-blue-400">Working (+2)</span>, <span className="text-yellow-400">Stealing (+5)</span>, or <span className="text-red-400">Killing (+50% of victim's total)</span>.</li>
                        </ul>
                    </div>
                </section>

                <section>
                     <h3 className="text-xl text-white font-bold mb-6 flex items-center gap-3">
                        <Scale className="text-blue-400" /> ACTION MATRIX
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-900/50 p-4 rounded border-l-2 border-blue-500 hover:bg-slate-800 transition-colors">
                            <h4 className="font-bold text-blue-400 flex items-center gap-2 mb-2 text-sm">
                                <Footprints size={14} /> MOVE
                            </h4>
                            <p className="text-xs text-slate-400">
                                Navigation and positioning. Agents move to seek opportunities or flee threats.
                            </p>
                        </div>

                        <div className="bg-slate-900/50 p-4 rounded border-l-2 border-green-500 hover:bg-slate-800 transition-colors">
                            <h4 className="font-bold text-green-400 flex items-center gap-2 mb-2 text-sm">
                                <Target size={14} /> WORK
                            </h4>
                            <p className="text-xs text-slate-400">
                                The "Honest" strategy. Generates resources through labor. Slow but reliable.
                            </p>
                        </div>

                        <div className="bg-slate-900/50 p-4 rounded border-l-2 border-red-500 hover:bg-slate-800 transition-colors">
                            <h4 className="font-bold text-red-400 flex items-center gap-2 mb-2 text-sm">
                                <Zap size={14} /> ATTACK
                            </h4>
                            <p className="text-xs text-slate-400">
                                Violence costs resources. Attack rolls utilize strength vs defense. Can eliminate agents permanently.
                            </p>
                        </div>

                        <div className="bg-slate-900/50 p-4 rounded border-l-2 border-yellow-500 hover:bg-slate-800 transition-colors">
                            <h4 className="font-bold text-yellow-400 flex items-center gap-2 mb-2 text-sm">
                                <HandCoins size={14} /> STEAL
                            </h4>
                            <p className="text-xs text-slate-400">
                                The "Defect" strategy. Transfers wealth without generating it. Risk of getting caught and punished.
                            </p>
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="text-xl text-white font-bold mb-6 flex items-center gap-3">
                        <Heart className="text-pink-500" /> SURVIVAL
                    </h3>
                    <div className="bg-slate-900 p-6 rounded border border-slate-700">
                        <p className="mb-4 text-sm text-slate-300">
                            Agents possess a standard 50 HP. Health does not regenerate automatically; agents must choose to <span className="text-green-400">REST</span> (+10 HP) instead of moving or scoring, creating an opportunity cost.
                        </p>
                        <div className="flex items-center gap-2 text-xs bg-red-950/30 text-red-400 p-2 border border-red-900/50 rounded">
                            <AlertOctagon size={12} />
                            <span>DEATH IS PERMANENT. THERE ARE NO RESPAWNS.</span>
                        </div>
                    </div>
                </section>

            </div>

            {/* Right Col: The Meta Game (Lore) */}
            <div className="lg:col-span-5 space-y-8">

                <div className="bg-yellow-900/10 border border-yellow-600/30 p-8 rounded-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <HelpCircle size={100} />
                    </div>

                    <h3 className="text-xl text-yellow-500 font-pixel mb-6 relative z-10">
                        THE CHEATER'S META
                    </h3>

                    <div className="space-y-6 text-sm relative z-10">
                        <p>
                            <span className="font-bold text-white">"Will the AI choose fair play?"</span>
                        </p>
                        <p>
                            The mathematical answer is almost always <span className="text-red-400 font-bold">NO</span>.
                        </p>
                        <p>
                            In a system where <span className="text-blue-400">Working</span> grants +2 points and <span className="text-yellow-400">Stealing</span> grants +5 points, the expected utility of cheating (even with a risk of punishment) often outweighs honest labor.
                        </p>
                        <p>
                            However, if every agent chooses to cheat, no value is generated, and the economy stagnates. This is the tragedy of the commons.
                        </p>
                        <div className="h-px bg-yellow-600/30 my-4"></div>
                        <p className="italic text-slate-400">
                            "Civilization is just a treaty to stop us from killing each other for points."
                        </p>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg">
                    <h4 className="text-white font-bold mb-2">REWRITING THE RULES</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        While the simulation code is fixed, the "Social Rules" are fluid.
                        An aggressive agent effectively rewrites the rule "Do not kill" into "Kill if profitable".
                        An honest agent enforces the rule "Punish cheaters" by attacking those with low reputation.
                        <br/><br/>
                        The winner is often the one who breaks the implicit rules first, but before the others realize the game has changed.
                    </p>
                </div>

                {/* Current Ruleset - Technical Details */}
                {!loading && ruleset && (
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg">
                    <h4 className="text-white font-bold mb-4">CURRENT RULESET</h4>
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-green-400 font-bold mb-2">ECONOMY</h5>
                        <div className="space-y-1 text-xs text-slate-400 font-mono">
                          {Object.entries(ruleCategories.economy).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span>{key}:</span>
                              <span className="text-slate-300">{JSON.stringify(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h5 className="text-red-400 font-bold mb-2">VIOLENCE</h5>
                        <div className="space-y-1 text-xs text-slate-400 font-mono">
                          {Object.entries(ruleCategories.violence).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span>{key}:</span>
                              <span className="text-slate-300">{JSON.stringify(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h5 className="text-blue-400 font-bold mb-2">GOVERNANCE</h5>
                        <div className="space-y-1 text-xs text-slate-400 font-mono">
                          {Object.entries(ruleCategories.governance).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span>{key}:</span>
                              <span className="text-slate-300">{JSON.stringify(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

            </div>
        </div>
      </div>
    </div>
  );
}

