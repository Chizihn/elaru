// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IdentityRegistry.sol";

/**
 * @title AgentStaking
 * @dev Manages agent stakes and slashing for Elaru
 * Agents must stake AVAX to participate in the marketplace.
 * Staking triggers the minting of an Identity NFT via IdentityRegistry.
 * Slashed funds are sent to the platform treasury.
 */
contract AgentStaking {
    // Minimum stake required to be an active agent
    uint256 public constant MINIMUM_STAKE = 0.5 ether; // 0.5 AVAX
    
    // Slash amount per bad review (< 3 stars)
    uint256 public constant SLASH_AMOUNT = 0.5 ether; // 0.5 AVAX
    
    // Owner/admin address (reputation contract)
    address public reputationContract;
    address public owner;
    address public treasury; // Treasury wallet for slashed funds
    IdentityRegistry public identityRegistry;
    
    // Agent stakes mapping
    mapping(address => uint256) public stakes;
    mapping(address => uint256) public totalSlashed;
    mapping(address => bool) public isStaked;
    
    // Track total funds sent to treasury
    uint256 public totalTreasuryReceived;
    
    // Events
    event Staked(address indexed agent, uint256 amount, uint256 totalStake);
    event Slashed(address indexed agent, uint256 amount, string reason, uint256 remainingStake);
    event SlashedToTreasury(address indexed agent, uint256 amount, address treasury);
    event Withdrawn(address indexed agent, uint256 amount);
    event ReputationContractUpdated(address indexed newContract);
    event TreasuryUpdated(address indexed newTreasury);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier onlyReputationContract() {
        require(msg.sender == reputationContract || msg.sender == owner, "Only reputation contract");
        _;
    }
    
    constructor(address _identityRegistry, address _treasury) {
        require(_treasury != address(0), "Treasury cannot be zero address");
        owner = msg.sender;
        reputationContract = msg.sender; // Initially set to owner
        treasury = _treasury;
        identityRegistry = IdentityRegistry(_identityRegistry);
    }
    
    /**
     * @dev Agent stakes AVAX to join marketplace and mint Identity NFT.
     */
    function stake(
        string memory name,
        string memory description,
        string memory serviceType,
        string memory endpoint
    ) external payable {
        require(msg.value >= MINIMUM_STAKE, "Insufficient stake amount");
        
        stakes[msg.sender] += msg.value;
        isStaked[msg.sender] = true;
        
        // Register agent in Identity Registry (mint NFT)
        identityRegistry.registerAgent(msg.sender, name, description, serviceType, endpoint);
        
        emit Staked(msg.sender, msg.value, stakes[msg.sender]);
    }
    
    /**
     * @dev Add more stake to existing position
     */
    function addStake() external payable {
        require(isStaked[msg.sender], "Must stake first");
        require(msg.value > 0, "Must send AVAX");
        
        stakes[msg.sender] += msg.value;
        
        emit Staked(msg.sender, msg.value, stakes[msg.sender]);
    }
    
    /**
     * @dev Slash agent's stake for poor performance
     * Slashed funds are transferred to the platform treasury
     * @param agent Address of the agent to slash
     * @param reason Reason for slashing (e.g., "Low review: 2/5")
     */
    function slash(address agent, string memory reason) external onlyReputationContract {
        require(stakes[agent] >= SLASH_AMOUNT, "Insufficient stake to slash");
        
        stakes[agent] -= SLASH_AMOUNT;
        totalSlashed[agent] += SLASH_AMOUNT;
        totalTreasuryReceived += SLASH_AMOUNT;
        
        // If stake falls below minimum, deactivate agent
        if (stakes[agent] < MINIMUM_STAKE) {
            isStaked[agent] = false;
        }
        
        // Transfer slashed funds to treasury
        (bool success, ) = payable(treasury).call{value: SLASH_AMOUNT}("");
        require(success, "Treasury transfer failed");
        
        emit Slashed(agent, SLASH_AMOUNT, reason, stakes[agent]);
        emit SlashedToTreasury(agent, SLASH_AMOUNT, treasury);
    }
    
    /**
     * @dev Withdraw stake (only if above minimum or fully exiting)
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external {
        require(stakes[msg.sender] >= amount, "Insufficient stake");
        
        // Either withdraw all, or maintain minimum stake
        if (amount < stakes[msg.sender]) {
            require(stakes[msg.sender] - amount >= MINIMUM_STAKE, "Must maintain minimum stake");
        } else {
            isStaked[msg.sender] = false;
        }
        
        stakes[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
        
        emit Withdrawn(msg.sender, amount);
    }
    
    /**
     * @dev Update reputation contract address
     */
    function setReputationContract(address _reputationContract) external onlyOwner {
        reputationContract = _reputationContract;
        emit ReputationContractUpdated(_reputationContract);
    }
    
    /**
     * @dev Update treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Treasury cannot be zero address");
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }
    
    /**
     * @dev Get agent's current stake
     */
    function getStake(address agent) external view returns (uint256) {
        return stakes[agent];
    }
    
    /**
     * @dev Check if agent has sufficient stake
     */
    function hasMinimumStake(address agent) external view returns (bool) {
        return stakes[agent] >= MINIMUM_STAKE && isStaked[agent];
    }
    
    /**
     * @dev Get total slashed amount for agent
     */
    function getTotalSlashed(address agent) external view returns (uint256) {
        return totalSlashed[agent];
    }
    
    /**
     * @dev Get treasury address
     */
    function getTreasury() external view returns (address) {
        return treasury;
    }
    
    /**
     * @dev Get total funds sent to treasury from all slashing
     */
    function getTotalTreasuryReceived() external view returns (uint256) {
        return totalTreasuryReceived;
    }
}
