// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ReputationRegistry.sol";

/**
 * @title ValidationRegistry
 * @dev Manages disputes and validator voting.
 * Allows validators to vote on task outcomes and trigger reputation updates.
 */
contract ValidationRegistry is Ownable {
    ReputationRegistry public reputationRegistry;

    struct Dispute {
        uint256 agentId;
        string reason;
        uint256 votesForAgent;
        uint256 votesAgainstAgent;
        bool resolved;
        mapping(address => bool) hasVoted;
    }

    struct Validation {
        address validator;
        address agent; // derived from dispute.agentId
        bytes32 taskHash; // placeholder as we don't store taskHash in dispute yet
        bool isValid;
        string comments;
        uint256 timestamp;
    }

    mapping(uint256 => Dispute) public disputes;
    uint256 public disputeCount;

    event DisputeRaised(uint256 indexed disputeId, uint256 indexed agentId, string reason);
    event Voted(uint256 indexed disputeId, address indexed voter, bool supportAgent);
    event DisputeResolved(uint256 indexed disputeId, bool agentWon);

    constructor(address _reputationRegistry) Ownable(msg.sender) {
        reputationRegistry = ReputationRegistry(_reputationRegistry);
    }

    /**
     * @dev Raises a new dispute against an agent.
     * @param agentId The ID of the agent.
     * @param reason The reason for the dispute.
     */
    function raiseDispute(uint256 agentId, string memory reason) public returns (uint256) {
        uint256 disputeId = disputeCount++;
        Dispute storage dispute = disputes[disputeId];
        dispute.agentId = agentId;
        dispute.reason = reason;
        
        emit DisputeRaised(disputeId, agentId, reason);
        return disputeId;
    }

    /**
     * @dev Casts a vote on a dispute.
     * @param disputeId The ID of the dispute.
     * @param supportAgent True if voting in favor of the agent, false otherwise.
     */
    function vote(uint256 disputeId, bool supportAgent) public {
        Dispute storage dispute = disputes[disputeId];
        require(!dispute.resolved, "Dispute already resolved");
        require(!dispute.hasVoted[msg.sender], "Already voted");

        dispute.hasVoted[msg.sender] = true;
        if (supportAgent) {
            dispute.votesForAgent++;
        } else {
            dispute.votesAgainstAgent++;
        }

        emit Voted(disputeId, msg.sender, supportAgent);

        // Simple resolution logic: if 2 votes cast, resolve
        if (dispute.votesForAgent + dispute.votesAgainstAgent >= 2) {
            _resolveDispute(disputeId);
        }
    }

    function _resolveDispute(uint256 disputeId) internal {
        Dispute storage dispute = disputes[disputeId];
        dispute.resolved = true;

        bool agentWon = dispute.votesForAgent > dispute.votesAgainstAgent;
        
        // Update reputation based on outcome
        // If agent won, it counts as a successful task (or at least not a failure)
        // If agent lost, it counts as a failure
        reputationRegistry.updateReputation(dispute.agentId, agentWon, dispute.reason);

        emit DisputeResolved(disputeId, agentWon);
    }

    /**
     * @dev Returns validations (disputes) for a given task hash.
     * Note: Since we don't store taskHash in Dispute struct in this simple version,
     * we will return an empty array or mock data to satisfy the ABI.
     * In a real implementation, we would map taskHash -> disputeId.
     */
    function getValidations(bytes32 taskHash) public view returns (Validation[] memory) {
        // For hackathon simplicity, we return an empty array as we don't index by taskHash yet.
        // This prevents the backend sync from crashing.
        return new Validation[](0);
    }
}
