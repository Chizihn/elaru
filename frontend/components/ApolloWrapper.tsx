'use client';

import { ApolloProvider } from '@apollo/client/react';
import client from '@/lib/apolloClient';

export function ApolloWrapper({ children }: { children: React.ReactNode }) {
  console.log('ApolloWrapper: Rendering provider');
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
