import { gql } from "@apollo/client";

export const AUTHENTICATE = gql`
  mutation Authenticate($walletAddress: String!, $signature: String!) {
    authenticate(walletAddress: $walletAddress, signature: $signature) {
      token
      user {
        id
        walletAddress
      }
    }
  }
`;
