from typing import List, Optional
from pydantic import BaseModel


class AgentWallet(BaseModel):
    agent_id: int
    strategy: str
    address: str
    balance: int
    alive: bool
    on_chain_balance: Optional[int] = None  # Real balance from blockchain


class WalletData(BaseModel):
    seed: int
    simulation_hash: str
    wallets: List[AgentWallet]