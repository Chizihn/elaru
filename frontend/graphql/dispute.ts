import { gql } from "@apollo/client";

export const GET_DISPUTES = gql`
  query GetDisputes {
    getAllDisputes {
      id
      reason
      status
      createdAt
      raisedBy
      task {
        id
        description
        paymentStatus
        agent {
          id
          serviceType
          walletAddress
        }
      }
      votes {
        validator
        approveRefund
      }
    }
  }
`;

export const RAISE_DISPUTE = gql`
  mutation RaiseDispute(
    $taskId: String!
    $reason: String!
    $raisedBy: String!
  ) {
    raiseDispute(taskId: $taskId, reason: $reason, raisedBy: $raisedBy) {
      id
      status
      reason
    }
  }
`;

export const VOTE_ON_DISPUTE = gql`
  mutation VoteOnDispute(
    $disputeId: String!
    $validator: String!
    $approveRefund: Boolean!
    $comment: String
  ) {
    voteOnDispute(
      disputeId: $disputeId
      validator: $validator
      approveRefund: $approveRefund
      comment: $comment
    ) {
      id
      validator
      approveRefund
    }
  }
`;
