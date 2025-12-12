import { http, createConfig, cookieStorage, createStorage } from 'wagmi'
import { avalancheFuji } from 'wagmi/chains'
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors'

// Core Wallet uses injected connector with specific detection
const coreWalletConnector = injected({
  target: {
    id: 'core',
    name: 'Core Wallet',
    provider: typeof window !== 'undefined' ? (window as any).avalanche : undefined,
  },
})

export const config = createConfig({
  chains: [avalancheFuji],
  connectors: [
    // MetaMask and other injected wallets (first = default)
    injected(),
    // Core Wallet (Avalanche's official wallet)
    coreWalletConnector,
    // WalletConnect for mobile wallets
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
    }),
    // Coinbase Wallet
    coinbaseWallet({
      appName: 'Elaru.AI',
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
