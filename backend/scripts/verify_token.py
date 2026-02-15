#!/usr/bin/env python3
"""
Verify DILEMMA Token Deployment on Monad Testnet

This script verifies that the deployed DILEMMA token contract is working correctly.
"""

import os
import sys
import json
import hashlib
from pathlib import Path
from dotenv import load_dotenv
from web3 import Web3
from solcx import compile_source, install_solc

# Load environment variables
load_dotenv()

class TokenVerifier:
    """Verify the deployed DILEMMA token contract."""

    def __init__(self, use_testnet: bool = None, contract_address: str = None, simulation_file: str = None):
        # Configuration: Use environment variable or parameter
        if use_testnet is None:
            use_testnet = os.getenv('USE_TESTNET', 'false').lower() == 'true'

        if use_testnet:
            # TESTNET CONFIGURATION
            self.rpc_url = "https://testnet-rpc.monad.xyz"
            self.explorer_url = "https://testnet.monadscan.com"
            self.network_name = "Monad Testnet"
            # Use testnet contract if not specified
            if contract_address is None:
                contract_address = "0xB572DD3dEc45240Ede10D67082A6560106568E16"
        else:
            # MAINNET CONFIGURATION
            self.rpc_url = "https://rpc.monad.xyz"
            self.explorer_url = "https://monadscan.com"
            self.network_name = "Monad Mainnet"
            # Mainnet contract will be set after deployment
            if contract_address is None:
                contract_address = ""

        self.contract_address = contract_address or ""
        self.simulation_file = simulation_file or "simulation_with_new_features_seed42.json"

        # Connect to network
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))

        if not self.w3.is_connected():
            raise ConnectionError(f"Cannot connect to Monad testnet RPC: {self.rpc_url}")

    def check_contract_deployment(self):
        """Check if contract is deployed and has code."""
        try:
            code = self.w3.eth.get_code(self.contract_address)
            has_code = code.hex() != '0x'
            print(f"Contract has code: {has_code}")
            if has_code:
                print(f"Code length: {len(code.hex()) // 2 - 1} bytes")
            return has_code
        except Exception as e:
            print(f"Error checking contract: {e}")
            return False

    def get_simulation_hash(self) -> bytes:
        """Compute the expected simulation hash."""
        # Load simulation results
        simulation_file = Path(__file__).parent.parent / "data" / "simulation_with_new_features_seed42.json"
        if not simulation_file.exists():
            raise FileNotFoundError(f"Simulation results not found: {simulation_file}")

        with open(simulation_file, 'r') as f:
            data = json.load(f)

        simulation_result = data.get("result", data)

        # Compute hash same way as deployment
        hash_data = {
            "seed": simulation_result.get("seed", 42),
            "turns_completed": simulation_result.get("turns_completed", 0),
            "leaderboard": simulation_result.get("leaderboard", []),
            "rules_version": simulation_result.get("rules_version", 1)
        }

        hash_string = json.dumps(hash_data, sort_keys=True, separators=(',', ':'))
        hash_hex = hashlib.sha256(hash_string.encode()).hexdigest()
        return bytes.fromhex(hash_hex)

    def get_contract_abi(self) -> list:
        """Get the contract ABI by compiling the source."""
        contract_path = Path(__file__).parent.parent.parent / "contracts" / "DilemmaToken.sol"

        if not contract_path.exists():
            raise FileNotFoundError(f"Contract not found: {contract_path}")

        print(f"📝 Compiling contract for verification: {contract_path}")

        # Install solc if not available
        try:
            install_solc('0.8.26')
        except Exception as e:
            print(f"⚠️  Could not install solc: {e}")
            print("   Using available version...")

        # Read contract source
        with open(contract_path, 'r') as f:
            contract_source = f.read()

        # Compile contract with same settings as deployment
        import_remappings = [
            "@openzeppelin/=../contracts/node_modules/@openzeppelin/"
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
            available_keys = list(compiled_sol.keys())
            raise ValueError(f"Contract {contract_key} not found. Available: {available_keys}")

        contract_interface = compiled_sol[contract_key]
        abi = contract_interface['abi']

        print(f"✅ Contract compiled successfully - ABI has {len(abi)} functions")
        return abi

    def verify_contract(self):
        """Verify the deployed contract."""
        print(f"\n🔍 Verifying DILEMMA Token Contract")
        print(f"🏠 Contract Address: {self.contract_address}")
        print(f"🔗 Explorer: {self.explorer_url}/address/{self.contract_address}")

        # Get contract ABI
        abi = self.get_contract_abi()
        print(f"📋 ABI loaded with {len(abi)} functions")

        contract = self.w3.eth.contract(address=self.contract_address, abi=abi)

        # Basic token info
        try:
            name = contract.functions.name().call()
            symbol = contract.functions.symbol().call()
            decimals = contract.functions.decimals().call()
            total_supply = contract.functions.totalSupply().call()

            print(f"   📛 Name: {name}")
            print(f"   🏷️  Symbol: {symbol}")
            print(f"   🔢 Decimals: {decimals} (raw value)")
            print(f"   💰 Total Supply: {total_supply / (10 ** decimals):,.0f} {symbol} (raw: {total_supply})")

        except Exception as e:
            print(f"   ❌ Error getting basic token info: {e}")
            return False

        # Simulation-specific info
        try:
            simulation_hash = contract.functions.simulationHash().call()
            agent_count = contract.functions.agentCount().call()

            expected_hash = self.get_simulation_hash()
            print(f"\n🎯 Simulation Data:")
            print(f"   🔐 Simulation Hash: 0x{simulation_hash.hex()}")
            print(f"   🔐 Expected Hash: 0x{expected_hash.hex()}")
            print(f"   ✅ Hash Match: {simulation_hash == expected_hash}")
            print(f"   👥 Agent Count: {agent_count}")

        except Exception as e:
            print(f"   ❌ Error getting simulation data: {e}")
            return False

        # Check agent wallets and balances
        print(f"\n👛 Agent Wallets & Balances:")
        
        # Load simulation data dynamically
        simulation_file = Path(__file__).parent.parent / "data" / self.simulation_file
        with open(simulation_file, 'r') as f:
            sim_data = json.load(f)
        
        leaderboard = sim_data.get("leaderboard", [])
        expected_total_tokens = sum(agent["resources"] for agent in leaderboard)
        
        total_verified = 0
        total_balance = 0
        for i, agent in enumerate(leaderboard):
            try:
                expected_agent_id = agent["agent_id"]
                expected_balance_tokens = agent["resources"]

                # Get data from contract using agent ID as key
                wallet = contract.functions.agentWallets(expected_agent_id).call()
                balance_wei = contract.functions.balanceOf(wallet).call()
                stored_agent_id = contract.functions.walletToAgent(wallet).call()

                # Generate expected wallet for comparison
                from scripts.wallet_generator import WalletGenerator
                expected_wallet, _ = WalletGenerator.generate_agent_wallet(expected_agent_id, sim_data.get("seed", 42))

                expected_balance_wei = expected_balance_tokens * (10 ** decimals)
                balance_ok = balance_wei == expected_balance_wei
                wallet_ok = wallet.lower() == expected_wallet.lower()
                agent_id_ok = stored_agent_id == expected_agent_id

                status = "✅" if (balance_ok and wallet_ok and agent_id_ok) else "❌"
                balance_formatted = balance_wei / (10 ** decimals)

                print(f"   {status} Agent {i} (ID: {expected_agent_id}): {balance_formatted:,.0f}/{expected_balance_tokens} DLM")
                print(f"      Contract Wallet: {wallet}")
                print(f"      Expected Wallet:  {expected_wallet}")
                print(f"      Wallet Match: {wallet_ok} | Agent ID Match: {agent_id_ok}")

                if balance_ok and wallet_ok and agent_id_ok:
                    total_verified += 1
                total_balance += balance_formatted

                print()

            except Exception as e:
                print(f"   ❌ Error checking agent {i}: {e}")
                print()

        # Verify total supply
        expected_total_wei = expected_total_tokens * (10 ** decimals)
        total_supply_tokens = total_supply / (10 ** decimals)
        supply_match = total_balance == total_supply_tokens and total_supply_tokens == expected_total_tokens
        print(f"\n💰 Balance Verification:")
        print(f"   Total Balance Sum: {total_balance:,.0f} DLM")
        print(f"   Total Supply: {total_supply_tokens:,.0f} DLM")
        print(f"   Expected Total: {expected_total_tokens:,.0f} DLM")
        print(f"   ✅ Supply Match: {supply_match}")

        print(f"\n📊 Verification Summary:")
        print(f"   ✅ Agents verified: {total_verified}/{len(leaderboard)}")
        print(f"   ✅ Contract deployed: {self.w3.eth.get_code(self.contract_address).hex() != '0x'}")
        print(f"   ✅ Hash verified: {simulation_hash == expected_hash}")

        success = total_verified == len(leaderboard) and supply_match and simulation_hash == expected_hash
        print(f"\n🎯 Final Result: {'✅ VERIFICATION SUCCESSFUL' if success else '❌ VERIFICATION FAILED'}")

        return success


def main():
    """Main verification function."""
    import argparse

    parser = argparse.ArgumentParser(description='Verify DILEMMA token contract deployment')
    parser.add_argument('--testnet', action='store_true', help='Verify on testnet')
    parser.add_argument('--mainnet', action='store_true', help='Verify on mainnet (default)')
    parser.add_argument('--contract', help='Contract address to verify (overrides default)')
    parser.add_argument('--simulation', help='Simulation data file to verify against (default: simulation_with_new_features_seed42.json)')

    args = parser.parse_args()

    # Determine network
    use_testnet = args.testnet or (not args.mainnet and os.getenv('USE_TESTNET', 'false').lower() == 'true')

    try:
        verifier = TokenVerifier(use_testnet=use_testnet, contract_address=args.contract, simulation_file=args.simulation)

        print(f"🔍 Verifying DILEMMA Token Contract on {verifier.network_name}")
        print(f"🏠 Contract Address: {verifier.contract_address}")
        print(f"🔗 Explorer: {verifier.explorer_url}/address/{verifier.contract_address}")
        print("="*50)

        # First check if contract exists
        if not verifier.check_contract_deployment():
            print(f"\n❌ Contract not found at {verifier.contract_address}")
            print("   The contract may not have been deployed successfully.")
            return

        success = verifier.verify_contract()

        if success:
            print(f"\n🎉 The DILEMMA token contract is successfully deployed and verified!")
            print("   All agent wallets have the correct token balances.")
            print("   The simulation results are permanently encoded on-chain.")
        else:
            print(f"\n❌ Contract verification failed. Please check the deployment.")

    except Exception as e:
        print(f"❌ Verification error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()