// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IdentityRegistry.sol";

/**
 * @title ReputationRegistry
 * @dev Stores trust scores and feedback for agents.
 * Linked to IdentityRegistry to ensure only registered agents can have reputation.
 */
contract ReputationRegistry is Ownable {
    IdentityRegistry public identityRegistry;

    struct Reputation {
        uint256 score;       // Current trust score (0-100)
        uint256 totalTasks;  // Total tasks completed
        uint256 successfulTasks; // Number of successful tasks
    }

    mapping(uint256 => Reputation) public agentReputations;

    event ReputationUpdated(uint256 indexed agentId, uint256 newScore);
    event FeedbackReceived(uint256 indexed agentId, bool success, string comment);

    constructor(address _identityRegistry) Ownable(msg.sender) {
        identityRegistry = IdentityRegistry(_identityRegistry);
    }

    /**
     * @dev Updates the reputation of an agent based on task outcome.
     * Can only be called by authorized contracts (e.g. ValidationRegistry).
     * @param agentId The ID of the agent.
     * @param success Whether the task was successful.
     * @param comment Optional feedback comment.
     */
    function updateReputation(uint256 agentId, bool success, string memory comment) public {
        // In a real implementation, this would be restricted to the ValidationRegistry
        // For now, we allow anyone to call it for testing purposes, or restrict to owner
        // require(msg.sender == owner(), "Only owner can update reputation"); 

        Reputation storage rep = agentReputations[agentId];

        // Initialize score to 50 if this is the first task
        if (rep.totalTasks == 0 && rep.score == 0) {
            rep.score = 50;
        }

        rep.totalTasks++;
        if (success) {
            rep.successfulTasks++;
            // Bonus for success (+2)
            if (rep.score <= 98) {
                rep.score += 2;
            } else {
                rep.score = 100;
            }
        } else {
            // Heavy penalty for failure (-10) to clearly show slashing impact
            if (rep.score >= 10) {
                rep.score -= 10;
            } else {
                rep.score = 0;
            }
        }

        emit FeedbackReceived(agentId, success, comment);
        emit ReputationUpdated(agentId, rep.score);
    }

    function getReputation(uint256 agentId) public view returns (uint256, uint256, uint256) {
        Reputation memory rep = agentReputations[agentId];
        // Default to 50 if no history
        if (rep.totalTasks == 0) {
            return (50, 0, 0); 
        }
        return (rep.score, rep.totalTasks, rep.successfulTasks);
    }

    function getAgentStats(uint256 agentId) public view returns (uint256 totalFeedbacks, uint256 totalScore, uint256 averageScore) {
        Reputation memory rep = agentReputations[agentId];
        
        uint256 currentScore = rep.score;
        if (rep.totalTasks == 0) {
            currentScore = 50;
        }
        
        return (rep.totalTasks, currentScore, currentScore);
    }
}
