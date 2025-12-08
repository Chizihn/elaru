// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IdentityRegistry
 * @dev ERC-721 based registry for AI Agents.
 * Each agent is represented by a unique NFT.
 * The token URI points to the Agent Card (JSON metadata).
 */
contract IdentityRegistry is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    mapping(address => uint256) private _agentIds;

    struct AgentMetadata {
        string name;
        string description;
        string serviceType;
        string endpoint;
        address operatorAddress;
        uint256 registeredAt;
        bool isActive;
    }

    mapping(uint256 => AgentMetadata) public agentMetadata;

    event AgentRegistered(uint256 indexed agentId, address indexed owner, string serviceType);
    event AgentUpdated(uint256 indexed agentId, string endpoint);

    constructor() ERC721("Elaru Agent Identity", "TRAI") Ownable(msg.sender) {}

    /**
     * @dev Registers a new agent.
     */
    function registerAgent(
        address to, 
        string memory name,
        string memory description,
        string memory serviceType,
        string memory endpoint
    ) public returns (uint256) {
        require(_agentIds[to] == 0, "Address already has a registered agent");
        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId);
        
        agentMetadata[tokenId] = AgentMetadata({
            name: name,
            description: description,
            serviceType: serviceType,
            endpoint: endpoint,
            operatorAddress: to,
            registeredAt: block.timestamp,
            isActive: true
        });

        _agentIds[to] = tokenId;
        emit AgentRegistered(tokenId, to, serviceType);
        return tokenId;
    }

    /**
     * @dev Updates the endpoint for an existing agent.
     */
    function updateAgent(uint256 tokenId, string memory newEndpoint) public {
        require(ownerOf(tokenId) == msg.sender, "Caller is not the agent owner");
        agentMetadata[tokenId].endpoint = newEndpoint;
        emit AgentUpdated(tokenId, newEndpoint);
    }

    /**
     * @dev Gets the agent ID for a given owner address.
     * @param owner The address of the agent owner.
     * @return The ID of the agent. Returns 0 if not found.
     */
    function getAgentId(address owner) public view returns (uint256) {
        return _agentIds[owner];
    }

    function totalAgents() public view returns (uint256) {
        return _nextTokenId;
    }

    function getAgentMetadata(uint256 tokenId) public view returns (AgentMetadata memory) {
        return agentMetadata[tokenId];
    }
}
