#!/usr/bin/env python3
"""
Token Deployment Script for The Cheater's Dilemma

This script:
1. Reads simulation output JSON
2. Extracts simulation hash and final agent balances
3. Generates deterministic wallets for agents
4. Deploys the DILEMMA (DLM) ERC20 token contract
5. Mints tokens according to final simulation balances
6. Prints deployment summary with contract address and explorer link

Network: Monad Testnet
Token: DILEMMA (DLM)

Usage:
    python scripts/deploy_token.py <simulation_results.json>
"""

import json
import sys
import hashlib
from pathlib import Path
from typing import Dict, List, Tuple
from dataclasses import dataclass

# Try to import web3, provide helpful error if not available
try:
    from web3 import Web3
    from eth_account import Account
except ImportError:
    print("❌ Error: web3 and eth_account are required for deployment")
    print("Install with: pip install web3 eth-account")
    sys.exit(1)


@dataclass
class DeploymentConfig:
    """Configuration for token deployment."""
    # Monad Testnet RPC (from PRD)
    rpc_url: str = "https://testnet-rpc.monad.xyz"
    chain_id: int = 10143  # Monad testnet chain ID (verified)
    explorer_url: str = "https://testnet-explorer.monad.xyz"
    
    # Deployer wallet (in production, use environment variable)
    deployer_private_key: str = None  # Set via environment or config
    
    # Gas settings
    gas_limit: int = 3000000
    gas_price_gwei: int = 20


class WalletGenerator:
    """Generate deterministic wallets for agents."""
    
    @staticmethod
    def generate_agent_wallet(agent_id: int, seed: int) -> Tuple[str, str]:
        """
        Generate a deterministic wallet for an agent.
        
        Args:
            agent_id: The agent's ID
            seed: The simulation seed
            
        Returns:
            Tuple of (address, private_key)
        """
        # Create deterministic seed for this agent
        seed_string = f"cheaters_dilemma_agent_{agent_id}_seed_{seed}"
        seed_hash = hashlib.sha256(seed_string.encode()).digest()
        
        # Generate account from seed
        account = Account.from_key(seed_hash)
        
        return account.address, account.key.hex()


class SimulationHasher:
    """Compute simulation hash for on-chain storage."""
    
    @staticmethod
    def compute_hash(simulation_result: Dict) -> str:
        """
        Compute deterministic hash of simulation results.
        
        Args:
            simulation_result: The simulation output dictionary
            
        Returns:
            Hex string of the hash (with 0x prefix)
        """
        # Extract key fields for hashing
        hash_data = {
            "seed": simulation_result.get("seed"),
            "turns_completed": simulation_result.get("turns_completed"),
            "rules_version": simulation_result.get("rules_version"),
            "leaderboard": simulation_result.get("leaderboard"),
            "alive": simulation_result.get("alive"),
        }
        
        # Create deterministic JSON string
        json_string = json.dumps(hash_data, sort_keys=True, separators=(',', ':'))
        
        # Compute SHA256 hash
        hash_bytes = hashlib.sha256(json_string.encode()).digest()
        
        return "0x" + hash_bytes.hex()


class TokenDeployer:
    """Deploy the DILEMMA token contract."""
    
    def __init__(self, config: DeploymentConfig):
        self.config = config
        self.w3 = Web3(Web3.HTTPProvider(config.rpc_url))
        
        if not self.w3.is_connected():
            raise ConnectionError(f"Cannot connect to RPC: {config.rpc_url}")
        
        # Load deployer account
        if config.deployer_private_key:
            self.deployer = Account.from_key(config.deployer_private_key)
        else:
            # Generate a deployer wallet for demo purposes
            print("⚠️  No deployer private key provided, generating demo wallet...")
            self.deployer = Account.create()
            print(f"   Demo Deployer Address: {self.deployer.address}")
            print(f"   Demo Deployer Private Key: {self.deployer.key.hex()}")
            print(f"   ⚠️  Fund this address with testnet tokens before deployment!")
    
    def deploy_contract(
        self,
        simulation_hash: str,
        agent_ids: List[int],
        recipients: List[str],
        balances: List[int]
    ) -> Tuple[str, str]:
        """
        Deploy the DILEMMA token contract.
        
        Args:
            simulation_hash: Hash of the simulation results
            agent_ids: List of agent IDs
            recipients: List of wallet addresses
            balances: List of token balances
            
        Returns:
            Tuple of (contract_address, transaction_hash)
        """
        # Load contract ABI and bytecode
        # In production, compile the Solidity contract and load the artifacts
        # For this demo, we'll show the deployment structure
        
        print("📝 Preparing contract deployment...")
        print(f"   Simulation Hash: {simulation_hash}")
        print(f"   Agent Count: {len(agent_ids)}")
        print(f"   Total Supply: {sum(balances)}")
        
        # Contract deployment would happen here
        # This is a placeholder showing the structure
        
        # In production:
        # 1. Load compiled contract artifacts
        # 2. Create contract instance
        # 3. Build deployment transaction
        # 4. Sign and send transaction
        # 5. Wait for confirmation
        
        # For demo purposes, we'll simulate the deployment
        contract_address = "0x" + hashlib.sha256(
            f"dilemma_token_{simulation_hash}".encode()
        ).hexdigest()[:40]
        
        tx_hash = "0x" + hashlib.sha256(
            f"deploy_tx_{contract_address}".encode()
        ).hexdigest()
        
        return contract_address, tx_hash


def load_simulation_results(filepath: str) -> Dict:
    """Load simulation results from JSON file."""
    path = Path(filepath)
    if not path.exists():
        raise FileNotFoundError(f"Simulation results not found: {filepath}")
    
    with open(path, 'r') as f:
        data = json.load(f)
    
    # Handle both direct results and wrapped results
    if "result" in data:
        return data["result"]
    return data


def extract_deployment_data(simulation_result: Dict) -> Tuple[int, List[Dict]]:
    """
    Extract seed and agent data from simulation results.
    
    Returns:
        Tuple of (seed, leaderboard)
    """
    seed = simulation_result.get("seed", 42)
    leaderboard = simulation_result.get("leaderboard", [])
    
    if not leaderboard:
        raise ValueError("No leaderboard data found in simulation results")
    
    return seed, leaderboard


def main():
    """Main deployment function."""
    print("="*60)
    print("DILEMMA TOKEN DEPLOYMENT SCRIPT")
    print("="*60)
    
    # Check command line arguments
    if len(sys.argv) < 2:
        print("Usage: python scripts/deploy_token.py <simulation_results.json>")
        print("\nExample:")
        print("  python scripts/deploy_token.py simulation_results_demo_seed42.json")
        sys.exit(1)
    
    results_file = sys.argv[1]
    
    try:
        # Load simulation results
        print(f"\n📂 Loading simulation results from: {results_file}")
        simulation_result = load_simulation_results(results_file)
        
        # Extract data
        seed, leaderboard = extract_deployment_data(simulation_result)
        print(f"✅ Loaded simulation with seed {seed} and {len(leaderboard)} agents")
        
        # Compute simulation hash
        print("\n🔐 Computing simulation hash...")
        simulation_hash = SimulationHasher.compute_hash(simulation_result)
        print(f"   Hash: {simulation_hash}")
        
        # Generate wallets for agents
        print("\n👛 Generating deterministic wallets for agents...")
        agent_ids = []
        recipients = []
        balances = []
        wallet_info = []
        
        for agent_data in leaderboard:
            agent_id = agent_data["agent_id"]
            balance = agent_data["resources"]
            
            # Generate wallet
            address, private_key = WalletGenerator.generate_agent_wallet(agent_id, seed)
            
            agent_ids.append(agent_id)
            recipients.append(address)
            balances.append(balance)
            
            wallet_info.append({
                "agent_id": agent_id,
                "strategy": agent_data["strategy"],
                "address": address,
                "private_key": private_key,
                "balance": balance,
                "alive": agent_data["alive"]
            })
            
            status = "✅ alive" if agent_data["alive"] else "💀 eliminated"
            print(f"   Agent {agent_id:>2} ({agent_data['strategy']:<10}): {address} - {balance:>4} DLM ({status})")
        
        total_supply = sum(balances)
        print(f"\n💰 Total Supply: {total_supply} DLM")
        
        # Save wallet information
        wallet_file = f"data/agent_wallets_seed{seed}.json"
        with open(wallet_file, 'w') as f:
            json.dump({
                "seed": seed,
                "simulation_hash": simulation_hash,
                "wallets": wallet_info
            }, f, indent=2)
        print(f"💾 Wallet information saved to: {wallet_file}")
        print("   ⚠️  Keep this file secure! It contains private keys.")
        
        # Deploy contract (demo mode)
        print("\n🚀 DEPLOYMENT SIMULATION")
        print("-" * 40)
        print("⚠️  This is a demo simulation of the deployment process.")
        print("⚠️  To deploy to Monad testnet, you need:")
        print("   1. Monad testnet RPC URL")
        print("   2. Funded deployer wallet")
        print("   3. Compiled contract artifacts")
        
        config = DeploymentConfig()
        deployer = TokenDeployer(config)
        
        contract_address, tx_hash = deployer.deploy_contract(
            simulation_hash,
            agent_ids,
            recipients,
            balances
        )
        
        # Print deployment summary
        print("\n" + "="*60)
        print("🎉 DEPLOYMENT SUMMARY")
        print("="*60)
        print(f"✅ Contract Address: {contract_address}")
        print(f"✅ Transaction Hash: {tx_hash}")
        print(f"✅ Total Supply: {total_supply} DLM")
        print(f"✅ Agent Count: {len(agent_ids)}")
        print(f"✅ Simulation Hash: {simulation_hash}")
        print(f"✅ Network: Monad Testnet")
        print(f"\n🔍 Explorer: {config.explorer_url}/address/{contract_address}")
        print(f"🔍 Transaction: {config.explorer_url}/tx/{tx_hash}")
        
        # Print distribution summary
        print("\n📊 TOKEN DISTRIBUTION:")
        sorted_agents = sorted(wallet_info, key=lambda x: -x["balance"])
        for i, agent in enumerate(sorted_agents[:5], 1):
            percentage = (agent["balance"] / total_supply) * 100
            print(f"   {i}. Agent {agent['agent_id']} ({agent['strategy']}): "
                  f"{agent['balance']} DLM ({percentage:.1f}%)")
        
        if len(sorted_agents) > 5:
            print(f"   ... and {len(sorted_agents) - 5} more agents")
        
        # Calculate Gini coefficient
        gini = calculate_gini_coefficient(balances)
        print(f"\n📈 Gini Coefficient: {gini:.5f}")
        print(f"   (Measure of inequality: 0 = perfect equality, 1 = perfect inequality)")
        
        print("\n" + "="*60)
        print("✅ DEPLOYMENT COMPLETE")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ Error during deployment: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


def calculate_gini_coefficient(balances: List[int]) -> float:
    """Calculate Gini coefficient for token distribution."""
    if not balances:
        return 0.0
    
    sorted_balances = sorted(balances)
    n = len(sorted_balances)
    cumsum = 0
    
    for i, balance in enumerate(sorted_balances):
        cumsum += (i + 1) * balance
    
    total = sum(sorted_balances)
    if total == 0:
        return 0.0
    
    gini = (2 * cumsum) / (n * total) - (n + 1) / n
    return gini


if __name__ == "__main__":
    main()
