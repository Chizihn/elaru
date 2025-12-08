// USDC Contract Address on Avalanche Fuji Testnet
export const USDC_ADDRESS = "0x5425890298aed601595a70AB815c96711a31Bc65"; // Fuji USDC

// USDC ABI (EIP-3009 functions)
export const USDC_ABI = [
  // Standard ERC20
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",

  // EIP-3009: Gasless transfers
  "function transferWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s)",
  "function receiveWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s)",

  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event AuthorizationUsed(address indexed authorizer, bytes32 indexed nonce)",
];

// Avalanche Fuji RPC
export const FUJI_RPC = "https://api.avax-test.network/ext/bc/C/rpc";

// Chain ID
export const FUJI_CHAIN_ID = 43113;

// Payment amounts (in USDC, 6 decimals)
export const PAYMENT_AMOUNTS = {
  REVIEW: "1000000", // 1 USDC
  TASK: "5000000", // 5 USDC
  PREMIUM: "10000000", // 10 USDC
};

// EIP-3009 Domain
export const EIP3009_DOMAIN = {
  name: "USD Coin",
  version: "2",
  chainId: FUJI_CHAIN_ID,
  verifyingContract: USDC_ADDRESS,
};

// EIP-3009 Types
export const EIP3009_TYPES = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
};
