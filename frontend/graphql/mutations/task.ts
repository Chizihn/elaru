import { gql } from "@apollo/client";

export const SUBMIT_TASK = gql`
  mutation SubmitTask($description: String!, $minTrustScore: Int!) {
    submitTask(description: $description, minTrustScore: $minTrustScore) {
      id
      description
      status
    }
  }
`;
