"use client";

import { useState, useEffect } from "react";
import { CONTRACT_ADDRESS, EXPLORER_URL, CURRENT_NETWORK, CONTRACT_CONFIG } from "@/lib/contract";
import { GamePanel, GameButton, StatDisplay } from "@/components/GameUI";
import { Terminal, Copy, ExternalLink, CheckCircle, AlertCircle, Loader, Wallet, Coins } from "lucide-react";

interface AgentWallet {
  agent_id: number;
  strategy: string;
  address: string;
  balance: number;
  alive: boolean;
  on_chain_balance?: number | null;
}

interface WalletData {
  seed: number;
  simulation_hash: string;
  wallets: AgentWallet[];
}

interface ContractInfo {
  network: string;
  contract_address: string;
  explorer_url: string;
  default_simulation_file: string;
}

interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount: number;
  timestamp: string;
  type: string;
  block_number: number;
}

export default function WalletsPage() {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [contractInfo, setContractInfo] = useState<ContractInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeed, setSelectedSeed] = useState(42);
  const [availableSeeds, setAvailableSeeds] = useState<number[]>([42]);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [blockchainConnected, setBlockchainConnected] = useState(false);

  useEffect(() => {
    loadAvailableSeeds();
    loadContractInfo();
    loadTransactions();
  }, []);

  useEffect(() => {
    loadWalletData(selectedSeed);
  }, [selectedSeed]);

  const loadContractInfo = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/wallets/contract');
      if (response.ok) {
        const data = await response.json();
        setContractInfo(data);
      }
    } catch (error) {
      console.error("Failed to load contract info:", error);
      // Fallback to config
      setContractInfo({
        network: CURRENT_NETWORK,
        contract_address: CONTRACT_ADDRESS,
        explorer_url: EXPLORER_URL,
        default_simulation_file: 'simulation_with_new_features_seed42.json'
      });
    }
  };

  const loadAvailableSeeds = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/wallets/seeds');
      if (response.ok) {
        const seeds = await response.json();
        setAvailableSeeds(seeds);
      }
    } catch (error) {
      console.error("Failed to load available seeds:", error);
      // Keep default seeds
    }
  };

  const loadWalletData = async (seed: number) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/v1/wallets?seed=${seed}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch wallet data: ${response.status}`);
      }
      const data = await response.json();
      setWalletData(data);
      // Check if blockchain is connected by seeing if any wallet has on_chain_balance
      const hasBlockchainData = data.wallets.some((wallet: AgentWallet) => wallet.on_chain_balance !== null && wallet.on_chain_balance !== undefined);
      setBlockchainConnected(hasBlockchainData);
    } catch (error) {
      console.error("Failed to load wallet data:", error);
      // Fallback to mock data if API is not available
      const mockData: WalletData = {
        seed: 42,
        simulation_hash: "0xbd7f2cf55962a92623691eeab845f062e3b711fdb8829c03ac8b4749eda5f651",
        wallets: [
          {
            agent_id: 2,
            strategy: "politician",
            address: "0x21dC627D1c9602607FD4dc0612D2f46cAA3A28f9",
            balance: 137,
            alive: true
          },
          {
            agent_id: 3,
            strategy: "warlord",
            address: "0xC292F856440225E32b4533fe00cBB0e41Aa2F9cd",
            balance: 134,
            alive: true
          },
          {
            agent_id: 0,
            strategy: "greedy",
            address: "0xb017B8eA4C368Dc867383C0DCfCC63c07c12bC67",
            balance: 131,
            alive: true
          },
          {
            agent_id: 4,
            strategy: "greedy",
            address: "0xAaa836974643bf4408BFfE421B68bbF5f022283D",
            balance: 128,
            alive: true
          },
          {
            agent_id: 5,
            strategy: "cheater",
            address: "0xbfAf538D2641262d796c55EB716f48b329706A20",
            balance: 90,
            alive: true
          },
          {
            agent_id: 1,
            strategy: "cheater",
            address: "0x17d3B19eD5dCD3eAC4cE5f438fEf0D00348Ed8f7",
            balance: 51,
            alive: true
          }
        ]
      };
      setWalletData(mockData);
      setBlockchainConnected(false); // Mock data means no blockchain connection
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/wallets/transactions');
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error("Failed to load transactions:", error);
      // Keep empty transactions array
    }
  };

  const copyToClipboard = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  const getStrategyColor = (strategy: string) => {
    switch(strategy.toLowerCase()) {
      case 'honest': return 'border-blue-500';
      case 'aggressive': return 'border-red-600';
      case 'deceptive': return 'border-purple-500';
      case 'chaotic': return 'border-orange-500';
      case 'politician': return 'border-cyan-500';
      case 'greedy': return 'border-yellow-500';
      case 'cheater': return 'border-red-500';
      case 'warlord': return 'border-red-700';
      default: return 'border-slate-500';
    }
  };

  const getStrategyBgColor = (strategy: string) => {
    switch(strategy.toLowerCase()) {
      case 'honest': return 'bg-blue-950/20';
      case 'aggressive': return 'bg-red-950/20';
      case 'deceptive': return 'bg-purple-950/20';
      case 'chaotic': return 'bg-orange-950/20';
      case 'politician': return 'bg-cyan-950/20';
      case 'greedy': return 'bg-yellow-950/20';
      case 'cheater': return 'bg-red-950/20';
      case 'warlord': return 'bg-red-950/30';
      default: return 'bg-slate-950/20';
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full overflow-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-yellow-500 font-pixel text-xl mb-4">LOADING WALLETS...</div>
            <div className="text-slate-400 font-mono text-sm">Fetching agent wallet data</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto p-3 sm:p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="text-center space-y-3 sm:space-y-4">
          <h1 className="retro-title text-2xl sm:text-3xl md:text-4xl">
            AGENT WALLETS
          </h1>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
          <p className="text-slate-400 font-mono text-xs sm:text-sm">
            Deterministic wallet addresses for autonomous agents
          </p>
        </div>

        {/* Contract Address */}
        <GamePanel title="SMART CONTRACT">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-400 font-bold text-sm font-mono">
              <Terminal size={16} />
              <span>DEPLOYED CONTRACT ADDRESS ({contractInfo?.network?.toUpperCase() || 'LOADING...'})</span>
            </div>
            <div className="bg-slate-800 p-4 rounded font-mono text-sm text-slate-300 border border-slate-600">
              <div className="flex flex-col gap-2">
                <div className="text-yellow-400 font-bold">{contractInfo?.contract_address || CONTRACT_ADDRESS}</div>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={`${contractInfo?.explorer_url || EXPLORER_URL}/address/${contractInfo?.contract_address || CONTRACT_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm underline whitespace-nowrap"
                  >
                    [ VIEW ON MONADSCAN ]
                  </a>
                  <a
                    href="https://nad.fun/tokens/0xb5d5f958ee9203Fc3a2000F2f42fce543d9E7777"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 text-sm underline whitespace-nowrap"
                  >
                    [ VIEW ON NAD.FUN ]
                  </a>
                </div>
              </div>
            </div>
            <p className="text-sm font-mono text-slate-400 leading-relaxed">
              The DilemmaToken contract governs agent economies and enables on-chain token transfers between autonomous agents during simulation.
            </p>
            
            {/* Blockchain Status */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-700">
              {blockchainConnected ? (
                <>
                  <CheckCircle size={16} className="text-green-400" />
                  <span className="text-green-400 text-sm font-mono">BLOCKCHAIN CONNECTED - REAL BALANCES</span>
                </>
              ) : (
                <>
                  <AlertCircle size={16} className="text-yellow-400" />
                  <span className="text-yellow-400 text-sm font-mono">OFFLINE MODE - STATIC BALANCES</span>
                </>
              )}
            </div>
          </div>
        </GamePanel>

        {/* Seed Selector */}
        <GamePanel title="WALLET CONFIGURATION">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="stat-label">SEED:</label>
              <select
                value={selectedSeed}
                onChange={(e) => setSelectedSeed(Number(e.target.value))}
                className="bg-slate-800 border border-slate-600 text-slate-300 px-3 py-1 font-mono text-sm focus:outline-none focus:border-yellow-500"
              >
                {availableSeeds.map(seed => (
                  <option key={seed} value={seed}>{seed}</option>
                ))}
              </select>
            </div>
            {walletData && (
              <div className="text-xs font-mono text-slate-400">
                <div>SIMULATION HASH: {walletData.simulation_hash}</div>
                <div>AGENTS: {walletData.wallets.length}</div>
              </div>
            )}
          </div>
        </GamePanel>

        {/* Wallets Grid */}
        {walletData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {walletData.wallets
              .sort((a, b) => b.balance - a.balance) // Sort by balance descending
              .map((wallet) => (
                <GamePanel
                  key={wallet.agent_id}
                  title={`AGENT ${wallet.agent_id}`}
                  className={`${getStrategyBgColor(wallet.strategy)} border-2 ${getStrategyColor(wallet.strategy)} ${!wallet.alive ? 'opacity-60' : ''}`}
                >
                  <div className="space-y-3">
                    {/* Strategy Badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-400 uppercase">
                        {wallet.strategy}
                      </span>
                      {!wallet.alive && (
                        <span className="text-xs font-mono text-red-400">DEAD</span>
                      )}
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                        <Wallet size={12} />
                        <span>ADDRESS</span>
                      </div>
                      <div className="bg-slate-800 p-2 rounded font-mono text-xs text-slate-300 border border-slate-600 break-all">
                        {wallet.address}
                      </div>
                      <div className="flex gap-2">
                        <GameButton
                          onClick={() => copyToClipboard(wallet.address)}
                          className="flex-1 text-xs py-1"
                        >
                          <Copy size={12} className="mr-1" />
                          {copiedAddress === wallet.address ? 'COPIED!' : 'COPY'}
                        </GameButton>
                        <GameButton
                          onClick={() => window.open(`${contractInfo?.explorer_url || EXPLORER_URL}/address/${wallet.address}`, '_blank')}
                          className="flex-1 text-xs py-1"
                        >
                          <ExternalLink size={12} className="mr-1" />
                          VIEW
                        </GameButton>
                      </div>
                    </div>

                    {/* Balance */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                      <div className="flex items-center gap-1 text-xs font-mono text-yellow-400">
                        <Coins size={12} />
                        <span>BALANCE</span>
                      </div>
                      <span className="text-sm font-mono text-yellow-400 font-bold">
                        {wallet.balance} DILEMMA
                      </span>
                    </div>
                  </div>
                </GamePanel>
              ))}
          </div>
        )}

        {/* Info Panel */}
        <GamePanel title="WALLET INFORMATION" variant="blue">
          <div className="space-y-3 text-xs font-mono text-slate-300">
            <div>
              <span className="text-blue-400">&gt;</span> Wallets are generated deterministically from seed + agent ID
            </div>
            <div>
              <span className="text-blue-400">&gt;</span> Same seed always produces the same addresses
            </div>
            <div>
              <span className="text-blue-400">&gt;</span> Agent count affects which agent IDs are generated
            </div>
            <div>
              <span className="text-blue-400">&gt;</span> Balances reflect current simulation state
            </div>
          </div>
        </GamePanel>

        {/* Recent Transactions */}
        {transactions.length > 0 && (
          <GamePanel title="RECENT TRANSACTIONS" variant="green">
            <div className="space-y-3">
              {transactions.map((tx, index) => (
                <div key={tx.hash} className="bg-slate-800 p-3 rounded border border-slate-600">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ExternalLink size={14} className="text-green-400" />
                      <span className="text-green-400 text-sm font-mono">TX #{index + 1}</span>
                    </div>
                    <span className="text-yellow-400 text-sm font-mono">
                      {tx.amount} DLM
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-400 space-y-1">
                    <div>From: {tx.from.slice(0, 6)}...{tx.from.slice(-4)}</div>
                    <div>To: {tx.to.slice(0, 6)}...{tx.to.slice(-4)}</div>
                    <div>Block: {tx.block_number}</div>
                  </div>
                </div>
              ))}
            </div>
          </GamePanel>
        )}
      </div>
    </div>
  );
}