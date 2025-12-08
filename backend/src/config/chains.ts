import { defineChain } from "thirdweb";

export interface ChainConfig {
  name: string;
  chainId: number;
  rpc: string;
  tokenAddress: string; // Wrapped USDC address
  thirdwebChain: any; // Thirdweb chain object
}

export const chains = {
  fuji: {
    name: "Avalanche Fuji Testnet",
    chainId: 43113,
    rpc: "https://api.avax-test.network/ext/bc/C/rpc",
    tokenAddress: "0x5425890298aed601595a70ab815c96711a31bc65", // USDC on Fuji
    thirdwebChain: defineChain(43113),
  },
  avalanche: {
    name: "Avalanche C-Chain",
    chainId: 43114,
    rpc: "https://api.avax.network/ext/bc/C/rpc",
    tokenAddress: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", // USDC on Avalanche
    thirdwebChain: defineChain(43114),
  },
};

// Default to Fuji for development/hackathon
export const activeChain = process.env.NODE_ENV === "production" ? chains.fuji : chains.fuji;
