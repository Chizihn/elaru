import { http, createConfig, cookieStorage, createStorage } from 'wagmi'
import { avalancheFuji } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

export const config = createConfig({
  chains: [avalancheFuji],
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
    }),
  ],
  ssr: true, // Enable SSR mode to prevent hydration mismatches
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: {
    [avalancheFuji.id]: http(),
  },
})
