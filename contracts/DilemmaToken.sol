// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title DilemmaToken
 * @notice DILEMMA (DLM) - Token representing final political power distribution
 *         from The Cheater's Dilemma simulation
 * 
 * @dev This contract:
 *      - Mints tokens only at deployment based on simulation results
 *      - Stores immutable simulation hash for verification
 *      - Has no transfer functionality (distribution is locked)
 *      - Is not upgradeable
 *      - Encodes final political power on-chain
 * 
 * Network: Monad Testnet
 * Symbol: DLM
 * Name: DILEMMA
 */
contract DilemmaToken is ERC20 {
    /// @notice Immutable hash of the simulation that determined token distribution
    bytes32 public immutable simulationHash;
    
    /// @notice Timestamp when the contract was deployed
    uint256 public immutable deploymentTimestamp;
    
    /// @notice Total number of agents in the simulation
    uint256 public immutable agentCount;
    
    /// @notice Mapping of agent IDs to their wallet addresses
    mapping(uint256 => address) public agentWallets;
    
    /// @notice Mapping of wallet addresses to agent IDs
    mapping(address => uint256) public walletToAgent;
    
    /// @notice Event emitted when tokens are minted to an agent
    event AgentTokensMinted(
        uint256 indexed agentId,
        address indexed wallet,
        uint256 amount
    );
    
    /**
     * @notice Deploy the DILEMMA token with simulation results
     * @param _simulationHash Hash of the simulation output (for verification)
     * @param _agentIds Array of agent IDs from the simulation
     * @param _recipients Array of wallet addresses (one per agent)
     * @param _balances Array of token amounts (final simulation balances)
     */
    constructor(
        bytes32 _simulationHash,
        uint256[] memory _agentIds,
        address[] memory _recipients,
        uint256[] memory _balances
    ) ERC20("DILEMMA", "DLM") {
        require(_agentIds.length == _recipients.length, "Length mismatch: agentIds vs recipients");
        require(_recipients.length == _balances.length, "Length mismatch: recipients vs balances");
        require(_agentIds.length > 0, "Must have at least one agent");
        require(_simulationHash != bytes32(0), "Invalid simulation hash");
        
        simulationHash = _simulationHash;
        deploymentTimestamp = block.timestamp;
        agentCount = _agentIds.length;
        
        // Mint tokens to each agent based on their final simulation balance
        for (uint256 i = 0; i < _agentIds.length; i++) {
            require(_recipients[i] != address(0), "Invalid recipient address");
            require(_balances[i] > 0, "Balance must be positive");
            
            uint256 agentId = _agentIds[i];
            address recipient = _recipients[i];
            uint256 balance = _balances[i];
            
            // Store agent-wallet mapping
            agentWallets[agentId] = recipient;
            walletToAgent[recipient] = agentId;
            
            // Mint tokens (convert token amount to wei)
            _mint(recipient, balance * 10**decimals());
            
            emit AgentTokensMinted(agentId, recipient, balance);
        }
    }
    
    /**
     * @notice Get the wallet address for a specific agent ID
     * @param agentId The agent ID from the simulation
     * @return The wallet address holding that agent's tokens
     */
    function getAgentWallet(uint256 agentId) external view returns (address) {
        return agentWallets[agentId];
    }
    
    /**
     * @notice Get the agent ID for a specific wallet address
     * @param wallet The wallet address
     * @return The agent ID associated with that wallet
     */
    function getAgentId(address wallet) external view returns (uint256) {
        return walletToAgent[wallet];
    }
    
    /**
     * @notice Verify that a simulation hash matches the stored hash
     * @param _hash The hash to verify
     * @return True if the hash matches
     */
    function verifySimulationHash(bytes32 _hash) external view returns (bool) {
        return simulationHash == _hash;
    }
    
    /**
     * @notice Get contract deployment information
     * @return hash The simulation hash
     * @return timestamp The deployment timestamp
     * @return agents The number of agents
     * @return supply The total token supply
     */
    function getDeploymentInfo() external view returns (
        bytes32 hash,
        uint256 timestamp,
        uint256 agents,
        uint256 supply
    ) {
        return (
            simulationHash,
            deploymentTimestamp,
            agentCount,
            totalSupply()
        );
    }
    
    /**
     * @notice Override transfer to make tokens non-transferable
     * @dev Tokens represent final political power and should not be transferable
     */
    function transfer(address, uint256) public pure override returns (bool) {
        revert("DILEMMA tokens are non-transferable");
    }
    
    /**
     * @notice Override transferFrom to make tokens non-transferable
     */
    function transferFrom(address, address, uint256) public pure override returns (bool) {
        revert("DILEMMA tokens are non-transferable");
    }
    
    /**
     * @notice Override approve to prevent approvals
     */
    function approve(address, uint256) public pure override returns (bool) {
        revert("DILEMMA tokens cannot be approved");
    }
}
