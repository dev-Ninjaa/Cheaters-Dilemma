"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { StatusIndicator } from "./StatusIndicator";

interface GameLayoutProps {
  leftPanel?: ReactNode;
  rightPanel?: ReactNode;
  topBar?: ReactNode;
  centerContent?: ReactNode;
}

export function GameLayout({
  leftPanel,
  rightPanel,
  topBar,
  centerContent,
}: GameLayoutProps) {
  return (
    <div className="w-screen h-screen bg-slate-950 overflow-hidden flex flex-col fixed inset-0">
      {topBar && (
        <div className="border-b border-slate-700 bg-slate-900/50 px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 flex items-center justify-between scanlines z-10">
          {topBar}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden gap-0">
        {leftPanel && (
          <div className="hidden lg:flex lg:w-64 flex flex-col gap-2 overflow-y-auto border-r border-slate-700 p-2">
            {leftPanel}
          </div>
        )}

        <div className="flex-1 bg-slate-950 relative overflow-hidden">
          {centerContent ? (
            centerContent
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 font-mono text-center px-4">
              <div>
                <div className="text-xl md:text-2xl font-bold text-yellow-500 mb-4 font-pixel">
                  &gt; SIMULATION AREA &lt;
                </div>
                <div className="text-xs md:text-sm opacity-50 font-mono">
                  &gt; WAITING FOR INPUT &lt;
                </div>
              </div>
            </div>
          )}
        </div>

        {rightPanel && (
          <div className="hidden xl:flex xl:w-80 flex flex-col gap-2 overflow-y-auto border-l border-slate-700 p-2">
            {rightPanel}
          </div>
        )}
      </div>
    </div>
  );
}

export function TopBar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "HOME" },
    { href: "/simulation", label: "SIMULATION" },
    { href: "/agents", label: "AGENTS" },
    { href: "/wallets", label: "WALLETS" },
    { href: "/rules", label: "RULES" },
    { href: "/replays", label: "REPLAYS" },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 md:gap-8 flex-1">
        <div className="text-base sm:text-lg md:text-2xl font-bold text-yellow-500 font-pixel tracking-tight">
          THE CHEATER&apos;S DILEMMA
        </div>
        <div className="flex flex-wrap gap-1 sm:gap-2 md:gap-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-2 sm:px-3 py-1 text-xs font-mono border transition-all duration-200 rounded-sm ${
                pathname === item.href
                  ? "border-yellow-500 bg-yellow-500/10 text-yellow-500"
                  : "border-slate-600 text-slate-400 hover:border-slate-400 hover:text-slate-300"
              }`}
            >
              [ {item.label} ]
            </Link>
          ))}
        </div>
      </div>
      <div className="flex gap-2 sm:gap-3 md:gap-6 text-xs font-mono text-slate-500 mt-1 sm:mt-0">
        <StatusIndicator />
      </div>
    </>
  );
}

