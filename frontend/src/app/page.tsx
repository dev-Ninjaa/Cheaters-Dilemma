import Link from "next/link";
import { GamePanel, GameButton } from "@/components/GameUI";
import { LandingSocketStatus } from "@/components/LandingSocketStatus";
import { Terminal, Cpu, BookOpen, BarChart3 } from "lucide-react";

export default function Home() {
  return (
    <div className="w-full h-full overflow-auto p-3 sm:p-4 md:p-6 bg-slate-950">
      <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6 md:space-y-10">
        {/* Title Section */}
        <div className="text-center space-y-2 sm:space-y-3 md:space-y-4 mb-6 sm:mb-8 md:mb-12">
          <h1 className="retro-title text-2xl sm:text-3xl md:text-4xl lg:text-6xl">
            THE CHEATER&apos;S DILEMMA
          </h1>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
          <h2 className="font-pixel text-sm sm:text-base md:text-lg lg:text-xl text-blue-400 tracking-widest">
            &gt; MULTI AGENT WAR GAME &lt;
          </h2>
          <p className="text-slate-500 font-mono text-xs sm:text-sm tracking-[0.2em] uppercase px-2 sm:px-4">
            WHERE TRUST IS A LIABILITY AND BETRAYAL IS A STRATEGY
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 md:gap-6">
          {/* Left Column: Philosophy & Content */}
          <div className="lg:col-span-7 space-y-3 sm:space-y-4 md:space-y-6">
            {/* Main Philosophy */}
            <div className="bg-slate-900/50 border border-slate-700 p-4 sm:p-6 rounded-sm shadow-lg relative group hover:border-slate-600 transition-colors">
              <div className="absolute -top-3 left-3 sm:left-4 bg-slate-950 px-2 text-yellow-500 font-pixel text-[10px] border border-slate-800">
                [ THE MATHEMATICS OF BETRAYAL ]
              </div>

              <div className="prose prose-invert max-w-none font-mono text-slate-300 space-y-4 text-sm">
                <p className="leading-relaxed">
                  <span className="text-yellow-400 font-bold">Game Theory</span>{" "}
                  dictates that in a zero-sum environment lacking a central
                  enforcer, the "Rational Actor" will always choose to cheat. It
                  is the{" "}
                  <span className="italic text-white">Nash Equilibrium</span> of
                  survival—if you play fair while others defect, you die.
                </p>
                <p className="leading-relaxed">
                  This simulation explores the{" "}
                  <span className="text-red-400 font-bold">
                    Prisoner's Dilemma
                  </span>{" "}
                  at scale. Trust is an expensive luxury. Betrayal is a free
                  optimization. When 20 agents compete for finite resources, the
                  "rules" become suggestions, and morality becomes a weakness.
                </p>
                <p className="leading-relaxed border-l-2 border-slate-600 pl-4 italic text-slate-400 text-xs">
                  "The easiest way to win is to break the rules before your
                  opponent realizes they are playing a game."
                </p>
              </div>
            </div>

            {/* Three Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-950/20 p-4 border border-blue-600/60 rounded-sm shadow-md">
                <div className="flex items-center gap-2 mb-2 text-blue-400 font-bold text-xs font-mono">
                  <Cpu size={14} />
                  <span>THE GINI COEFFICIENT</span>
                </div>
                <p className="text-xs font-mono text-slate-300 leading-relaxed">
                  As high-performing agents (or successful cheaters) accumulate
                  wealth, inequality spikes. Does the system collapse? Or do the
                  weak band together to topple the giants?
                </p>
              </div>

              <div className="bg-red-950/20 p-4 border border-red-600/60 rounded-sm shadow-md">
                <div className="flex items-center gap-2 mb-2 text-red-400 font-bold text-xs font-mono">
                  <Terminal size={14} />
                  <span>ALLIANCE PARADOX</span>
                </div>
                <p className="text-xs font-mono text-slate-300 leading-relaxed">
                  Formation of alliances provides safety, but the "First Mover"
                  paints a target on their back. Being the first to trust is
                  dangerous; being the last to trust is fatal.
                </p>
              </div>
            </div>

            {/* Three More Info Panels */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <GamePanel title="SYSTEM MODEL" variant="blue">
                <div className="space-y-2 text-xs font-mono text-slate-300">
                  <div>
                    <span className="text-blue-400">&gt;</span> Agents pursue
                    asymmetric strategies.
                  </div>
                  <div>
                    <span className="text-blue-400">&gt;</span> Action set:
                    work, steal, attack, vote.
                  </div>
                  <div>
                    <span className="text-blue-400">&gt;</span> Outcomes feed
                    trust & rankings.
                  </div>
                </div>
              </GamePanel>

              <GamePanel title="COMPETITION PRESSURE" variant="red">
                <div className="space-y-2 text-xs font-mono text-slate-300">
                  <div>
                    <span className="text-red-400">[1]</span> Resources compound
                    advantages.
                  </div>
                  <div>
                    <span className="text-red-400">[2]</span> Strong suppress
                    rivals.
                  </div>
                  <div>
                    <span className="text-red-400">[3]</span> Collusion wins.
                  </div>
                </div>
              </GamePanel>

              <GamePanel title="GOVERNANCE LOOP" variant="green">
                <div className="space-y-2 text-xs font-mono text-slate-300">
                  <div>
                    <span className="text-green-400">T1</span> Proposals
                    introduced.
                  </div>
                  <div>
                    <span className="text-green-400">T2</span> Voting applies
                    rules.
                  </div>
                  <div>
                    <span className="text-green-400">T3</span> Rules reshape
                    game.
                  </div>
                </div>
              </GamePanel>
            </div>
          </div>

          {/* Right Column: Menu & Actions */}
          <div className="lg:col-span-5 space-y-3 md:space-y-4 flex flex-col">
            {/* Launch World Button */}
            <Link href="/simulation">
              <button className="group relative bg-slate-900 hover:bg-slate-800 border-2 border-yellow-600/40 hover:border-yellow-500 p-6 transition-all duration-300 text-left overflow-hidden shadow-lg rounded-sm">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Terminal size={100} />
                </div>
                <div className="relative z-10">
                  <h3 className="text-2xl text-yellow-500 font-pixel mb-3 group-hover:translate-x-2 transition-transform">
                    &gt; LAUNCH WORLD &lt;
                  </h3>
                  <p className="text-slate-400 font-mono text-xs max-w-[85%]">
                    Initialize 20 autonomous agents. Observe real-time combat,
                    stealing algorithms, and emergent dynamics.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-mono text-yellow-600">
                    <span className="animate-pulse">●</span>{" "}
                    <span>SIMULATION ENGINE READY</span>
                  </div>
                </div>
              </button>
            </Link>

            {/* Sub Menu Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 md:gap-3 flex-1">
              <Link href="/agents" className="block">
                <button className="flex items-center justify-between bg-slate-900 border border-slate-700 hover:border-blue-500 hover:bg-slate-800/50 p-4 group transition-all rounded-sm w-full text-left">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1 text-slate-300 group-hover:text-blue-400">
                      <Cpu size={16} />{" "}
                      <span className="font-pixel text-xs">[ AGENTS ]</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Behavioral Architectures & Avatars
                    </span>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400 font-mono text-lg">
                    &gt;
                  </div>
                </button>
              </Link>

              <Link href="/wallets" className="block">
                <button className="flex items-center justify-between bg-slate-900 border border-slate-700 hover:border-purple-500 hover:bg-slate-800/50 p-4 group transition-all rounded-sm w-full text-left">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1 text-slate-300 group-hover:text-purple-400">
                      <Terminal size={16} />{" "}
                      <span className="font-pixel text-xs">[ WALLETS ]</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Agent Addresses & Token Balances
                    </span>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-400 font-mono text-lg">
                    &gt;
                  </div>
                </button>
              </Link>

              <Link href="/rules" className="block">
                <button className="flex items-center justify-between bg-slate-900 border border-slate-700 hover:border-green-500 hover:bg-slate-800/50 p-4 group transition-all rounded-sm w-full text-left">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1 text-slate-300 group-hover:text-green-400">
                      <BookOpen size={16} />{" "}
                      <span className="font-pixel text-xs">[ RULES ]</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      The Logic of Systemic Corruption
                    </span>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-green-400 font-mono text-lg">
                    &gt;
                  </div>
                </button>
              </Link>

              <Link href="/replays" className="block">
                <button className="flex items-center justify-between bg-slate-900 border border-slate-700 hover:border-red-500 hover:bg-slate-800/50 p-4 group transition-all rounded-sm w-full text-left">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1 text-slate-300 group-hover:text-red-400">
                      <BarChart3 size={16} />{" "}
                      <span className="font-pixel text-xs">[ REPLAYS ]</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Historical Outcomes & Analysis
                    </span>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 font-mono text-lg">
                    &gt;
                  </div>
                </button>
              </Link>

              <div className="flex-1 flex items-end">
                <GamePanel title="CONNECTION STATUS">
                  <LandingSocketStatus />
                </GamePanel>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

