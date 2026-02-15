// Contract configuration - can be overridden by environment variables for deployment
export const CONTRACT_CONFIG = {
  mainnet: {
    address: process.env.NEXT_PUBLIC_MAINNET_CONTRACT_ADDRESS || '0x31E22d9ea1CE639dc4959d5AfC7F8b20bBA0e9f4',
    explorer: 'https://monadscan.com',
    network: 'Monad Mainnet'
  },
  testnet: {
    address: process.env.NEXT_PUBLIC_TESTNET_CONTRACT_ADDRESS || '0xB572DD3dEc45240Ede10D67082A6560106568E16',
    explorer: 'https://testnet.monadscan.com',
    network: 'Monad Testnet'
  }
};

// Default to mainnet, can be overridden by env var
export const CURRENT_NETWORK = (process.env.NEXT_PUBLIC_DEFAULT_NETWORK || 'mainnet') as 'mainnet' | 'testnet';
export const CONTRACT_ADDRESS = CONTRACT_CONFIG[CURRENT_NETWORK].address;
export const EXPLORER_URL = CONTRACT_CONFIG[CURRENT_NETWORK].explorer;