from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
import json
import os
import sys
from pathlib import Path

from ..schemas.wallets import WalletData, AgentWallet
from ...core.config import settings
from ...services.blockchain_service import blockchain_service

# Import wallet generator
sys.path.append(str(Path(__file__).parent.parent.parent.parent / "scripts"))
from scripts.wallet_generator import WalletGenerator

router = APIRouter()


@router.get("/contract")
async def get_contract_info():
    """Get current contract configuration"""
    network = 'testnet' if settings.USE_TESTNET else 'mainnet'

    contract_address = settings.TESTNET_CONTRACT_ADDRESS if settings.USE_TESTNET else settings.MAINNET_CONTRACT_ADDRESS

    return {
        'network': network,
        'contract_address': contract_address,
        'explorer_url': 'https://testnet.monadscan.com' if settings.USE_TESTNET else 'https://monadscan.com',
        'default_simulation_file': settings.DEFAULT_SIMULATION_FILE
    }


@router.get("/", response_model=WalletData)
async def get_wallets(seed: int = Query(42, description="Simulation seed"), include_blockchain: bool = Query(True, description="Include real blockchain balances")):
    """Get wallet data for a specific seed with optional blockchain integration"""
    try:
        # Try to load wallet data from file first
        wallet_file = Path("data") / f"agent_wallets_seed{seed}.json"
        wallets = []

        if wallet_file.exists():
            # Load from file if it exists
            with open(wallet_file, 'r') as f:
                data = json.load(f)
                for wallet_data in data.get('wallets', []):
                    wallet = AgentWallet(
                        agent_id=wallet_data['agent_id'],
                        strategy=wallet_data['strategy'],
                        address=wallet_data['address'],
                        balance=wallet_data['balance'],
                        alive=wallet_data.get('alive', True)
                    )
                    wallets.append(wallet)
        else:
            # Generate deterministic wallets if no file exists
            # Use default strategies for seed 42
            strategies = ['greedy', 'cheater', 'politician', 'warlord', 'greedy', 'cheater', 'politician', 'warlord']
            for agent_id in range(8):
                address, _ = WalletGenerator.generate_agent_wallet(agent_id, seed)
                strategy = strategies[agent_id] if seed == 42 else 'unknown'
                wallet = AgentWallet(
                    agent_id=agent_id,
                    strategy=strategy,
                    address=address,
                    balance=100,  # Default balance
                    alive=True
                )
                wallets.append(wallet)

        # If blockchain integration is enabled, update balances with real on-chain data
        if include_blockchain:
            try:
                for wallet in wallets:
                    try:
                        # Get real balance from blockchain
                        real_balance = blockchain_service.get_balance(wallet.address)
                        # Convert from wei (18 decimals) to token units
                        real_balance_tokens = real_balance // (10 ** 18)
                        wallet.on_chain_balance = real_balance_tokens
                        # Update displayed balance to real balance
                        wallet.balance = real_balance_tokens
                    except Exception as e:
                        # If blockchain query fails, keep file balance but mark as offline
                        wallet.on_chain_balance = None
                        print(f"Failed to get blockchain balance for {wallet.address}: {e}")
            except Exception as e:
                print(f"Blockchain service error: {e}")
                # Continue with file balances if blockchain is unavailable

        simulation_hash = "0xbd7f2cf55962a92623691eeab845f062e3b711fdb8829c03ac8b4749eda5f651"
        if wallet_file.exists():
            with open(wallet_file, 'r') as f:
                file_data = json.load(f)
                simulation_hash = file_data.get('simulation_hash', simulation_hash)

        return WalletData(
            seed=seed,
            simulation_hash=simulation_hash,
            wallets=wallets
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load wallet data: {str(e)}")


@router.get("/transactions")
async def get_recent_transactions(limit: int = Query(10, description="Number of recent transactions to return")):
    """Get recent token transactions (mock data for now - would integrate with blockchain explorer API)"""
    # This would normally query a blockchain explorer API or parse blockchain events
    # For now, return mock transaction data
    mock_transactions = [
        {
            "hash": "0x8ba1f10975b7c6b9c8b6f6b7c8b6f6b7c8b6f6b7c8b6f6b7c8b6f6b7c8b6f6b7",
            "from": "0xb017B8eA4C368Dc867383C0DCfCC63c07c12bC67",
            "to": "0x21dC627D1c9602607FD4dc0612D2f46cAA3A28f9",
            "amount": 5,
            "timestamp": "2024-02-15T10:30:00Z",
            "type": "transfer",
            "block_number": 12345678
        },
        {
            "hash": "0x9ca2f20985c7d6c9d9c7g7c9d9c7g7c9d9c7g7c9d9c7g7c9d9c7g7c9d9c7g7c9",
            "from": "0xC292F856440225E32b4533fe00cBB0e41Aa2F9cd",
            "to": "0xAaa836974643bf4408BFfE421B68bbF5f022283D",
            "amount": 3,
            "timestamp": "2024-02-15T10:25:00Z",
            "type": "transfer",
            "block_number": 12345677
        }
    ]

    return {"transactions": mock_transactions[:limit]}
    """Get list of available seeds with wallet data"""
    try:
        data_dir = Path("data")
        if not data_dir.exists():
            return [42]  # Default seed

        wallet_files = list(data_dir.glob("agent_wallets_seed*.json"))
        seeds = []

        for file in wallet_files:
            try:
                seed_str = file.stem.replace("agent_wallets_seed", "")
                seed = int(seed_str)
                seeds.append(seed)
            except ValueError:
                continue

        # Always include seed 42 as fallback
        if 42 not in seeds:
            seeds.append(42)

        return sorted(seeds)

    except Exception as e:
        return [42]  # Fallback