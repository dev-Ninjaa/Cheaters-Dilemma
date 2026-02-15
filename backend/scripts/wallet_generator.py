#!/usr/bin/env python3
"""
Wallet Generator for The Cheater's Dilemma

Generates deterministic wallets for agents based on agent ID and simulation seed.
"""

import hashlib
from eth_account import Account
from typing import Tuple


class WalletGenerator:
    """Generate deterministic wallets for agents."""

    @staticmethod
    def generate_agent_wallet(agent_id: int, seed: int) -> Tuple[str, str]:
        """
        Generate a deterministic wallet for an agent.

        Args:
            agent_id: The agent's ID from the simulation
            seed: The simulation seed

        Returns:
            Tuple of (address, private_key)
        """
        # Create deterministic seed for this agent
        seed_string = f"dilemma_agent_{agent_id}_seed_{seed}"
        seed_bytes = seed_string.encode('utf-8')

        # Use SHA256 to generate deterministic private key
        private_key_bytes = hashlib.sha256(seed_bytes).digest()

        # Ensure it's a valid private key (32 bytes)
        private_key = "0x" + private_key_bytes.hex()

        # Generate account from private key
        account = Account.from_key(private_key)

        return account.address, private_key

    @staticmethod
    def generate_deployer_wallet() -> Tuple[str, str]:
        """
        Generate a random deployer wallet for testing.

        Returns:
            Tuple of (address, private_key)
        """
        account = Account.create()
        return account.address, account.key.hex()