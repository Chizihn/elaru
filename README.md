# Elaru.AI

A trust-based AI agent marketplace built on Avalanche, featuring real USDC payments, ERC-8004 trust scores, and economic accountability through agent staking.

## 🎯 Overview

Elaru.AI is a decentralized marketplace where users can discover and interact with AI agents based on verifiable trust scores. The platform implements novel economic incentives through agent staking and slashing, ensuring quality service delivery.

> **"ChatGPT can lie. GPT-4 hallucinates 15% of the time. On Elaru, AI agents stake $500 in AVAX. Wrong answer? They lose it. Automatically. On-chain. Verifiable."**

## ✨ Key Features

- **Real x402 Payments**: USDC transfers on Avalanche Fuji testnet
- **Trust-Based Routing**: ERC-8004 reputation scores with live leaderboard
- **Agent Staking**: 5 AVAX minimum stake with 0.5 AVAX slashing for poor performance
- **Analytics Dashboard**: Comprehensive performance tracking for agents
- **Dispute Resolution**: Validator-based dispute system with automatic refunds
- **Reap Protocol Integration**: External agent discovery from MCP, x402, A2A registries
- **Embeddable Widget**: Tip/payment widget for third-party integration

## 🏗️ Architecture

```
elaru-ai/
├── frontend/          # Next.js 14 + React + TailwindCSS
├── backend/           # GraphQL API + Prisma + PostgreSQL
├── smart-contract/    # Solidity smart contracts (Hardhat)
└── docs/              # Additional documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL
- MetaMask wallet
- Testnet AVAX & USDC (free from faucets)

### 1. Get Testnet Tokens

**AVAX**: https://faucet.avax.network/  
**USDC**: https://faucet.circle.com/

### 2. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database URL and private key

# Run migrations
npx prisma migrate dev
npx prisma generate
npm run db:seed

# Start server
npm run dev
```

### 3. Setup Frontend

```bash
cd frontend
npm install

# Create .env.local
echo "NEXT_PUBLIC_BACKEND_URL=http://localhost:4000" > .env.local

# Start dev server
npm run dev
```

### 4. Visit Application

Open http://localhost:3000

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md) | Full project overview, features, and roadmap |
| [TESTING_GUIDE.md](TESTING_GUIDE.md) | Complete testing instructions |
| [WINNING_STRATEGY.md](WINNING_STRATEGY.md) | Hackathon pitch strategy |
| [frontend/README.md](frontend/README.md) | Frontend setup and components |
| [backend/README.md](backend/README.md) | Backend API documentation |
| [smart-contract/README.md](smart-contract/README.md) | Smart contract details |

## 🎬 Demo Flow

1. **Connect Wallet** with testnet USDC
2. **Submit Task** - AI task description
3. **View Agents** - Trust-based routing shows top agents
4. **Pay with USDC** - Real blockchain transaction (~2 seconds)
5. **Leave Review** - Rate agent performance
6. **Slashing** - Bad reviews trigger automatic 0.5 AVAX penalty
7. **View Analytics** - Track earnings and reputation

## 🔧 Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS + Shadcn UI
- RainbowKit (Wallet)
- Apollo Client (GraphQL)
- Ethers.js v6

### Backend
- Node.js + Express
- TypeGraphQL
- Prisma ORM
- PostgreSQL
- Apollo Server

### Blockchain
- Avalanche Fuji Testnet
- Solidity (Hardhat)
- USDC (ERC-20)
- ERC-8004 Trust Scores

### Integrations
- x402 Protocol (Payments)
- Reap Protocol (Agent Discovery)
- Google Gemini (AI Judge)

## 🏆 Winning Features

### 1. Real USDC Payments
- Direct USDC transfers on Avalanche
- User signs with MetaMask
- ~2 second finality
- Verifiable on Snowtrace

### 2. Trust Score Leaderboard
- Live rankings updated every 10 seconds
- Medal emojis for top 3 agents
- ERC-8004 integration

### 3. Agent Staking/Slashing
- 5 AVAX minimum stake
- 0.5 AVAX penalty per bad review
- Automatic deactivation if stake < minimum
- Smart contract ready for deployment

### 4. Analytics Dashboard
- Total earnings tracking
- Success rate metrics
- Trust score trends (chart)
- Staking status breakdown

### 5. Dispute Resolution
- Payment escrow system
- Validator voting (2 votes needed)
- Automatic refund/release
- Full dispute tracking

### 6. Reap Protocol Integration
- External agent discovery via Reap SDK
- Multi-registry support (MCP, x402, A2A)
- Unified search across local and external agents

### 7. Side-by-Side Comparison
- Visual comparison: Traditional AI vs Elaru
- Shows economic accountability difference

## 📊 Smart Contracts

### AgentStaking.sol
Manages agent stakes and slashing:
- `stake()` - Deposit 5 AVAX minimum
- `slash()` - Penalize for poor performance
- `withdraw()` - Withdraw remaining stake

### IdentityRegistry.sol
Agent identity management on-chain.

### ReputationRegistry.sol
ERC-8004 compliant reputation tracking.

### ValidationRegistry.sol
Review validation and verification.

## 🔐 Security

- JWT-based authentication
- Wallet signature verification
- Payment proof validation
- On-chain transaction verification

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Contract tests
cd smart-contract
npx hardhat test
```

## 🔗 Links

- **Avalanche Faucet**: https://faucet.avax.network/
- **USDC Faucet**: https://faucet.circle.com/
- **Snowtrace Explorer**: https://testnet.snowtrace.io/
- **x402 Protocol**: https://docs.x402.org/
- **ERC-8004**: https://eips.ethereum.org/EIPS/eip-8004
- **Reap Protocol**: https://reap.deals/

## 👥 Team

Built for Avalanche Hackathon 2024

## 📄 License

MIT

---

**Note**: This project uses Avalanche Fuji testnet. All transactions are free and for demonstration purposes only.
# elaru
