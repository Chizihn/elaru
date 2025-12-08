import { gql } from "@apollo/client";

export const GET_USER_TASKS = gql`
  query GetUserTasks {
    getUserTasks {
      id
      description
      status
      createdAt
      completedAt
      paymentStatus
      paymentTxHash
      reviewScore
      disputeStatus
      result
      agent {
        id
        serviceType
        walletAddress
      }
    }
  }
`;
