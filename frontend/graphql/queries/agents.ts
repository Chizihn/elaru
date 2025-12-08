import { gql } from "@apollo/client";

export const FIND_AGENTS = gql`
  query FindAgentsForTask($taskDescription: String!, $minTrustScore: Int!) {
    findAgentsForTask(
      taskDescription: $taskDescription
      minTrustScore: $minTrustScore
    ) {
      id
      name
      serviceType
      reputationScore
      pricePerRequest
      description
      endpoint
      stakedAmount
      slashedAmount
      stakingTxHash
      completedTasksCount
      validationCount
      successRate
    }
  }
`;

export const GET_AGENT_DETAILS = gql`
  query GetAgentDetails($id: String!, $walletAddress: String!) {
    getAgent(id: $id) {
      id
      name
      serviceType
      reputationScore
      pricePerRequest
      endpoint
      description
      walletAddress
    }
    getValidations(agentId: $id) {
      id
      validator
      isValid
      comments
      timestamp
    }
    getReputation(agentId: $id) {
      totalScore
      reviewCount
      feedbacks {
        id
        reviewer
        score
        comment
        timestamp
      }
    }
    getAgentEarnings(walletAddress: $walletAddress)
  }
`;

export const GET_AGENT_ANALYTICS = gql`
  query GetAgentAnalytics($agentId: String!) {
    getAgent(id: $agentId) {
      id
      serviceType
      reputationScore
      stakedAmount
      slashedAmount
    }
    getReputation(agentId: $agentId) {
      reviewCount
      feedbacks {
        score
        timestamp
      }
    }
  }
`;

export const GET_OPERATOR_DATA = gql`
  query GetOperatorData($walletAddress: String!) {
    getUserAgents(walletAddress: $walletAddress) {
      id
      name
      serviceType
      reputationScore
      active
      pricePerRequest
      walletAddress
    }
    getTotalNetworkVolume
    getAgentEarnings(walletAddress: $walletAddress)
  }
`;

export const GET_USER_AGENTS = gql`
  query GetUserAgents($walletAddress: String!) {
    getUserAgents(walletAddress: $walletAddress) {
      id
      name
      active
    }
  }
`;

export const GET_REPUTATION_DATA = gql`
  query GetReputationData($skip: Int!, $take: Int!) {
    getAgents(skip: $skip, take: $take) {
      id
      name
      serviceType
      reputationScore
      walletAddress
      stakedAmount
      pricePerRequest
    }
    getTotalNetworkVolume
    getReputationHistory {
      date
      score
    }
  }
`;

export const GET_TOP_AGENTS = gql`
  query GetTopAgents($limit: Int!) {
    getTopAgents(limit: $limit) {
      id
      name
      serviceType
      reputationScore
      walletAddress
    }
  }
`;
