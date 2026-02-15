"""
Blockchain service for on-chain token interactions during simulation.
"""

from typing import Optional, Dict, Any
from web3 import Web3
from web3.contract import Contract
from eth_account import Account
import os
from pathlib import Path
from app.core.config import settings

class BlockchainService:
    """Service for interacting with the DilemmaToken contract on-chain."""

    def __init__(self):
        # Use settings for network configuration
        if settings.USE_TESTNET:
            self.rpc_url = settings.TESTNET_RPC_URL
            self.chain_id = settings.TESTNET_CHAIN_ID
            self.contract_address = settings.TESTNET_CONTRACT_ADDRESS
        else:
            self.rpc_url = settings.MONAD_RPC_URL
            self.chain_id = settings.MONAD_CHAIN_ID
            self.contract_address = settings.MAINNET_CONTRACT_ADDRESS
        
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))

        if not self.w3.is_connected():
            raise ConnectionError(f"Cannot connect to RPC: {self.rpc_url}")

        # Load contract ABI (simplified ERC20)
        self.contract_abi = [
            {"inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}], "name": "transfer", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "nonpayable", "type": "function"},
            {"inputs": [{"internalType": "address", "name": "account", "type": "address"}], "name": "balanceOf", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
            {"inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "name": "agentWallets", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"},
            {"inputs": [{"internalType": "uint256", "name": "fromAgentId", "type": "uint256"}, {"internalType": "uint256", "name": "toAgentId", "type": "uint256"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}], "name": "transferBetweenAgents", "outputs": [], "stateMutability": "nonpayable", "type": "function"}
        ]

        self.contract: Optional[Contract] = None

        # Load deployer account for signing
        self.account = None
        if settings.DEPLOYER_PRIVATE_KEY:
            self.account = Account.from_key(settings.DEPLOYER_PRIVATE_KEY)

    def get_contract(self) -> Contract:
        """Get the contract instance."""
        if not self.contract:
            self.contract = self.w3.eth.contract(
                address=self.contract_address,
                abi=self.contract_abi
            )
        return self.contract

    def get_agent_wallet(self, agent_id: int) -> str:
        """Get the wallet address for an agent."""
        contract = self.get_contract()
        return contract.functions.agentWallets(agent_id).call()

    def get_balance(self, address: str) -> int:
        """Get token balance for an address."""
        contract = self.get_contract()
        return contract.functions.balanceOf(address).call()

    def transfer_tokens(self, from_agent_id: int, to_agent_id: int, amount: int) -> bool:
        """Transfer tokens between agents on-chain using deployer account."""
        if not self.account:
            print("No private key available for signing")
            return False

        try:
            contract = self.get_contract()

            # Build transaction for transferBetweenAgents
            nonce = self.w3.eth.get_transaction_count(self.account.address)
            txn = contract.functions.transferBetweenAgents(from_agent_id, to_agent_id, amount).build_transaction({
                'chainId': self.chain_id,
                'gas': 100000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': nonce,
            })

            # Sign and send
            signed_txn = self.account.sign_transaction(txn)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)

            # Wait for confirmation
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

            return receipt.status == 1

        except Exception as e:
            print(f"Transfer failed: {e}")
            return False

# Global instance
blockchain_service = BlockchainService()