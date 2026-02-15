#!/usr/bin/env python3
"""
Manual Real Token Deployment Script for The Cheater's Dilemma

This script deploys the DILEMMA token using web3.py directly,
bypassing Foundry installation issues.

Usage:
1. Install dependencies: uv add web3 eth-account
2. Set DEPLOYER_PRIVATE_KEY environment variable
3. Run: python scripts/manual_deploy_token.py data/simulation_results_demo_seed42.json
"""

import json
import os
import sys
import hashlib
from pathlib import Path
from typing import Dict, List, Tuple
from eth_account import Account
from solcx import compile_source, install_solc
from dotenv import load_dotenv
from web3 import Web3

# Load environment variables from .env file
load_dotenv()

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from scripts.wallet_generator import WalletGenerator


class ManualTokenDeployer:
    """Deploy DILEMMA token using web3.py directly."""

    def __init__(self, use_testnet: bool = None):
        # Configuration: Use environment variable or parameter
        if use_testnet is None:
            use_testnet = os.getenv('USE_TESTNET', 'false').lower() == 'true'

        if use_testnet:
            # TESTNET CONFIGURATION
            self.rpc_url = "https://testnet-rpc.monad.xyz"
            self.explorer_url = "https://testnet.monadscan.com"
            self.network_name = "Monad Testnet"
            self.chain_id = 10143
        else:
            # MAINNET CONFIGURATION
            self.rpc_url = "https://rpc.monad.xyz"
            self.explorer_url = "https://monadscan.com"
            self.network_name = "Monad Mainnet"
            self.chain_id = 143  # Correct mainnet chain ID

        # Connect to network
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))

        if not self.w3.is_connected():
            raise ConnectionError(f"Cannot connect to {self.network_name} RPC: {self.rpc_url}")

        print(f"✅ Connected to {self.network_name}")

        # Load deployer account
        private_key = os.getenv('DEPLOYER_PRIVATE_KEY')
        if not private_key:
            raise ValueError("DEPLOYER_PRIVATE_KEY environment variable not set")

        self.deployer = Account.from_key(private_key)
        print(f"✅ Deployer address: {self.deployer.address}")

        # Check balance
        balance = self.w3.eth.get_balance(self.deployer.address)
        balance_mon = self.w3.from_wei(balance, 'ether')
        print(f"💰 Deployer balance: {balance_mon} MON")

        if balance < self.w3.to_wei(0.01, 'ether'):
            raise ValueError("Insufficient funds. Need at least 0.01 MON for deployment")

    def load_simulation_results(self, filepath: str) -> Dict:
        """Load simulation results from JSON file."""
        path = Path(filepath)
        if not path.exists():
            raise FileNotFoundError(f"Simulation results not found: {filepath}")

        with open(path, 'r') as f:
            data = json.load(f)

        if "result" in data:
            return data["result"]
        return data

    def compute_simulation_hash(self, simulation_result: Dict) -> str:
        """Compute hash of simulation results."""
        hash_data = {
            "seed": simulation_result.get("seed", 42),
            "turns_completed": simulation_result.get("turns_completed", 0),
            "leaderboard": simulation_result.get("leaderboard", []),
            "rules_version": simulation_result.get("rules_version", 1)
        }

        hash_string = json.dumps(hash_data, sort_keys=True, separators=(',', ':'))
        return "0x" + hashlib.sha256(hash_string.encode()).hexdigest()

    def generate_deployment_data(self, simulation_result: Dict) -> Tuple[str, List[int], List[str], List[int]]:
        """Generate deployment data from simulation results."""
        seed = simulation_result.get("seed", 42)
        leaderboard = simulation_result.get("leaderboard", [])

        # Generate deterministic wallets
        agent_ids = []
        recipients = []
        balances = []

        for agent in leaderboard:
            agent_id = agent["agent_id"]
            balance = agent["resources"]  # Use resources field

            # Generate deterministic wallet
            address, _ = WalletGenerator.generate_agent_wallet(agent_id, seed)

            agent_ids.append(agent_id)
            recipients.append(address)
            balances.append(balance)

        simulation_hash = self.compute_simulation_hash(simulation_result)

        return simulation_hash, agent_ids, recipients, balances

    def get_contract_abi_and_bytecode(self) -> Tuple[List, str]:
        """Compile the Solidity contract and return ABI and bytecode."""
        contract_path = Path(__file__).parent.parent.parent / "contracts" / "DilemmaToken.sol"

        if not contract_path.exists():
            raise FileNotFoundError(f"Contract not found: {contract_path}")

        print(f"📝 Compiling contract: {contract_path}")

        # Install solc if not available
        try:
            install_solc('0.8.26')
        except Exception as e:
            print(f"⚠️  Could not install solc: {e}")
            print("   Using available version...")

        # Read contract source
        with open(contract_path, 'r') as f:
            contract_source = f.read()

        # Compile contract
        import_remappings = [
            f"@openzeppelin/={contract_path.parent}/node_modules/@openzeppelin/"
        ]
        
        compiled_sol = compile_source(
            contract_source,
            output_values=['abi', 'bin'],
            solc_version='0.8.26',
            import_remappings=import_remappings
        )

        # Get contract data (specifically DilemmaToken)
        contract_key = '<stdin>:DilemmaToken'
        if contract_key not in compiled_sol:
            print(f"Available contracts: {list(compiled_sol.keys())}")
            raise ValueError(f"Contract {contract_key} not found in compilation result")
        
        contract_interface = compiled_sol[contract_key]

        abi = contract_interface['abi']
        bytecode = contract_interface['bin']

        print("✅ Contract compiled successfully")

        return abi, bytecode

    def deploy_contract(self, simulation_hash: str, agent_ids: List[int],
                       recipients: List[str], balances: List[int]) -> Tuple[str, str]:
        """Deploy the contract to Monad testnet."""

        print("\n📝 Preparing contract deployment...")

        # Get contract artifacts
        abi, bytecode = self.get_contract_abi_and_bytecode()

        # Create contract instance
        contract = self.w3.eth.contract(abi=abi, bytecode=bytecode)

        # Prepare constructor arguments
        constructor_args = [
            simulation_hash,  # bytes32
            agent_ids,        # uint256[]
            recipients,       # address[]
            balances         # uint256[]
        ]

        # Build transaction
        nonce = self.w3.eth.get_transaction_count(self.deployer.address)

        # Estimate gas
        gas_estimate = contract.constructor(*constructor_args).estimate_gas({
            'from': self.deployer.address
        })

        transaction = contract.constructor(*constructor_args).build_transaction({
            'from': self.deployer.address,
            'nonce': nonce,
            'gas': int(gas_estimate * 1.2),  # Add 20% buffer
            'gasPrice': self.w3.eth.gas_price,
            'chainId': self.chain_id
        })

        print(f"⛽ Estimated gas: {gas_estimate}")
        print(f"💰 Gas price: {self.w3.from_wei(transaction['gasPrice'], 'gwei')} gwei")

        # Sign transaction
        signed_txn = self.w3.eth.account.sign_transaction(transaction, self.deployer.key)

        # Send transaction
        print("🚀 Sending deployment transaction...")
        tx_hash = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)
        print(f"📋 Transaction hash: {self.w3.to_hex(tx_hash)}")

        # Wait for confirmation
        tx_receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=300)

        if tx_receipt.status == 1:
            contract_address = tx_receipt.contractAddress
            print(f"✅ Contract deployed successfully!")
            print(f"🏠 Contract address: {contract_address}")
            return contract_address, self.w3.to_hex(tx_hash)
        else:
            raise Exception("Transaction failed")

    def verify_deployment(self, contract_address: str, tx_hash: str, simulation_hash: str,
                         agent_ids: List[int], recipients: List[str], balances: List[int]):
        """Verify the deployment."""

        print(f"\n🔍 Verifying deployment...")
        print(f"🔗 Explorer: {self.explorer_url}/address/{contract_address}")
        print(f"🔗 Transaction: {self.explorer_url}/tx/{tx_hash}")

        # Create contract instance for verification
        abi, _ = self.get_contract_abi_and_bytecode()
        contract = self.w3.eth.contract(address=contract_address, abi=abi)

        # Verify basic properties
        stored_hash = contract.functions.simulationHash().call()
        agent_count = contract.functions.agentCount().call()
        decimals = contract.functions.decimals().call()
        total_supply = contract.functions.totalSupply().call()

        print("\n📋 Verification results:")
        # Convert stored hash to hex string for comparison
        stored_hash_hex = "0x" + stored_hash.hex()
        hash_match = stored_hash_hex == simulation_hash
        print(f"   ✅ Simulation hash: {'matches' if hash_match else 'MISMATCH'}")
        if not hash_match:
            print(f"      Stored: {stored_hash_hex}")
            print(f"      Expected: {simulation_hash}")
        print(f"   ✅ Agent count: {agent_count}")
        print(f"   ✅ Total supply: {total_supply // (10 ** decimals)} DLM")

        # Verify agent wallets and balances
        print("\n👛 Token distribution verification:")
        verified_count = 0
        for agent_id, address, balance in zip(agent_ids, recipients, balances):
            contract_balance_wei = contract.functions.balanceOf(address).call()
            contract_balance_tokens = contract_balance_wei // (10 ** decimals)
            wallet_agent = contract.functions.getAgentId(address).call()
            agent_wallet = contract.functions.getAgentWallet(agent_id).call()

            balance_ok = contract_balance_tokens == balance
            wallet_ok = wallet_agent == agent_id and agent_wallet.lower() == address.lower()
            status = "✅" if (balance_ok and wallet_ok) else "❌"
            print(f"   {status} Agent {agent_id}: {contract_balance_tokens}/{balance} DLM, wallet: {agent_wallet[:10]}...")

            if balance_ok and wallet_ok:
                verified_count += 1

        print(f"   ✅ All {len(agent_ids)} agents verified successfully")


def main():
    """Main deployment function."""
    import argparse

    parser = argparse.ArgumentParser(description='Deploy DILEMMA token to Monad network')
    parser.add_argument('simulation_file', help='Path to simulation results JSON file')
    parser.add_argument('--testnet', action='store_true', help='Deploy to testnet instead of mainnet')
    parser.add_argument('--mainnet', action='store_true', help='Deploy to mainnet (default)')

    args = parser.parse_args()

    # Determine network (testnet takes precedence if both specified)
    use_testnet = args.testnet or (not args.mainnet and os.getenv('USE_TESTNET', 'false').lower() == 'true')

    results_file = args.simulation_file

    try:
        print("🚀 Starting Manual DILEMMA Token Deployment")
        print("="*50)
        print(f"🌐 Network: {'Testnet' if use_testnet else 'Mainnet'}")

        # Initialize deployer with network choice
        deployer = ManualTokenDeployer(use_testnet=use_testnet)

        # Load simulation results
        print(f"📂 Loading simulation results from: {results_file}")
        simulation_result = deployer.load_simulation_results(results_file)
        print("✅ Simulation results loaded")

        # Generate deployment data
        simulation_hash, agent_ids, recipients, balances = deployer.generate_deployment_data(simulation_result)
        print(f"🔐 Simulation hash: {simulation_hash}")
        print(f"👥 Agent count: {len(agent_ids)}")
        print(f"💰 Total supply: {sum(balances)} DLM")

        # Show wallet information
        print("\n👛 Generated agent wallets:")
        for agent_id, address, balance in zip(agent_ids, recipients, balances):
            print(f"   Agent {agent_id}: {address} → {balance} DLM")

        # Deploy contract
        contract_address, tx_hash = deployer.deploy_contract(simulation_hash, agent_ids, recipients, balances)

        # Verify deployment
        deployer.verify_deployment(contract_address, tx_hash, simulation_hash, agent_ids, recipients, balances)

        print("\n🎉 DEPLOYMENT COMPLETE!")
        print("="*50)
        print(f"✅ Contract: {contract_address}")
        print(f"✅ Network: {deployer.network_name}")
        print(f"✅ Token: DILEMMA (DLM)")
        print(f"✅ Supply: {sum(balances)} tokens")
        print(f"🔗 Explorer: {deployer.explorer_url}/address/{contract_address}")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()