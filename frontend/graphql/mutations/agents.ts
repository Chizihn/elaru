import { gql } from "@apollo/client";

export const RECORD_AGENT_INTERACTION = gql`
  mutation RecordAgentInteraction(
    $agentId: String!
    $description: String!
    $txHash: String!
    $result: String!
  ) {
    recordAgentInteraction(
      agentId: $agentId
      description: $description
      txHash: $txHash
      result: $result
    ) {
      id
    }
  }
`;

export const REGISTER_AGENT_MUTATION = gql`
  mutation RegisterAgent(
    $walletAddress: String!
    $name: String!
    $serviceType: String!
    $endpoint: String!
    $description: String!
    $pricePerRequest: String!
    $responseType: String!
  ) {
    registerAgent(
      walletAddress: $walletAddress
      name: $name
      serviceType: $serviceType
      endpoint: $endpoint
      description: $description
      pricePerRequest: $pricePerRequest
      responseType: $responseType
    ) {
      id
      walletAddress
    }
  }
`;

export const STAKE_AGENT = gql`
  mutation StakeAgent(
    $walletAddress: String!
    $stakedAmount: String!
    $stakingTxHash: String!
  ) {
    stakeAgent(
      walletAddress: $walletAddress
      stakedAmount: $stakedAmount
      stakingTxHash: $stakingTxHash
    ) {
      id
      active
      stakedAmount
    }
  }
`;
