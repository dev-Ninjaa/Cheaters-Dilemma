from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # API Settings
    api_v1_str: str = "/api/v1"
    secret_key: str = "your-secret-key-here"
    access_token_expire_minutes: int = 60 * 24 * 8  # 8 days

    # Server Settings
    server_name: str = "The Cheater's Dilemma API"
    server_host: str = "http://localhost"
    server_port: int = 8000
    debug: bool = True

    # CORS Settings
    backend_cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "https://cheaters-dilemma.vercel.app",
    ]

    # Simulation Settings
    max_agents: int = 20
    max_turns: int = 1000

    # Blockchain Settings
    DEPLOYER_PRIVATE_KEY: str = ""
    USE_TESTNET: bool = True
    MAINNET_CONTRACT_ADDRESS: str = "0x31E22d9ea1CE639dc4959d5AfC7F8b20bBA0e9f4"
    TESTNET_CONTRACT_ADDRESS: str = "0xB572DD3dEc45240Ede10D67082A6560106568E16"
    DEFAULT_SIMULATION_FILE: str = "simulation_with_new_features_seed42.json"
    
    # Blockchain Network Settings
    MONAD_RPC_URL: str = "https://rpc.monad.xyz"
    MONAD_CHAIN_ID: int = 143
    TESTNET_RPC_URL: str = "https://testnet-rpc.monad.xyz"
    TESTNET_CHAIN_ID: int = 10143

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Allow extra environment variables


settings = Settings()
