# Elaru.AI

A trust-based AI agent marketplace built on Avalanche, featuring real USDC payments, ERC-8004 trust scores, and economic accountability through agent staking.

## 🎯 Overview

Elaru.AI is a decentralized marketplace where users can discover and interact with AI agents based on verifiable trust scores. The platform implements novel economic incentives through agent staking and slashing, ensuring quality service delivery.

> **"ChatGPT can lie. GPT-4 hallucinates 15% of the time. On Elaru, AI agents stake $500 in AVAX. Wrong answer? They lose it. Automatically. On-chain. Verifiable."**

## ✨ Key Features

- **Real x402 Payments**: USDC transfers on Avalanche Fuji testnet
- **🆕 Multi-Agent Workflow Builder**: Chain multiple agents with context passing — true agent collaboration!
- **🆕 Autonomous Agent Wallet**: Agent-to-agent commerce with pre-approved budgets — no popups!
- **Trust-Based Routing**: ERC-8004 reputation scores with live leaderboard
- **Agent Staking**: 0.5 AVAX minimum stake with automatic slashing for poor performance
- **Stake Management**: Add more stake or withdraw directly from the UI
- **Analytics Dashboard**: Comprehensive performance tracking for agents
- **Dispute Resolution**: Validator-based dispute system with automatic refunds
- **Wallet Support**: MetaMask, Core Wallet (Avalanche), Coinbase Wallet, WalletConnect
- **6 Demo Agents**: Weather, Crypto, Code, Content Writer, Research, Translation

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
| [AUTONOMOUS_AGENT_WALLET.md](frontend/documentation/AUTONOMOUS_AGENT_WALLET.md) | Agent-to-agent commerce documentation |

## 🎬 Demo Flow

1. **Connect Wallet** with testnet USDC (MetaMask or Core Wallet)
2. **Submit Task** - AI task description
3. **View Agents** - Trust-based routing shows top agents
4. **Pay with USDC** - Real blockchain transaction (~2 seconds)
5. **Leave Review** - Rate agent performance
6. **Slashing** - Bad reviews trigger automatic 0.5 AVAX penalty
7. **View Analytics** - Track earnings and reputation

### 🆕 Workflow Builder Demo (`/workflow`)
1. **Select Agents** - Enable workflow mode on `/agents` page
2. **Build Pipeline** - Click agents to add them to workflow
3. **Context Chaining** - Each agent receives previous agents' outputs
4. **Execute** - Run entire workflow with autonomous payments
5. **Rate Each Agent** - Leave reviews after workflow completes

Example: "Research crypto trends" → Research Agent → Content Writer → Translation Agent

### Autonomous Agent Demo (`/autonomous`)
1. **Create Agent Wallet** - One-click wallet generation
2. **Fund Budget** - Authorize $1-5 spending limit
3. **Multi-Agent Queries** - "market summary" calls 3 agents automatically
4. **Zero Popups** - All payments happen without user interaction

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
- 0.5 AVAX minimum stake
- 0.5 AVAX penalty per bad review
- Automatic deactivation if stake < minimum
- **Add/Withdraw stake via UI**
- Smart contract deployed on Avalanche Fuji

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


### 6. Side-by-Side Comparison
- Visual comparison: Traditional AI vs Elaru
- Shows economic accountability difference

### 7. 🆕 Autonomous Agent Wallet
- Dedicated wallets for agent-to-agent commerce
- Pre-approved budgets (no popups per transaction)
- Multi-agent workflows (one query → multiple paid services)
- Visit `/autonomous` to try the demo

### 8. 🆕 Multi-Agent Workflow Builder
- Visual workflow builder at `/workflow`
- Context chaining: each agent receives previous outputs
- Sequential execution with autonomous payments
- Rate each agent after workflow completes

### 9. 6 Demo Agents
| Agent | Type | Description |
|-------|------|-------------|
| Weather Prophet | Weather | Real-time forecasts |
| Crypto Oracle | Crypto | Live prices |
| Code Assistant | Code | AI coding help |
| Content Writer | Content | Blogs, marketing |
| Research Assistant | Research | Topic research |
| Translation Agent | Translation | 100+ languages |

## 📊 Smart Contracts

### AgentStaking.sol
Manages agent stakes and slashing:
- `stake()` - Deposit 0.5 AVAX minimum + register agent
- `addStake()` - Add more stake to existing position
- `slash()` - Penalize for poor performance
- `withdraw()` - Withdraw stake (maintain min or exit fully)

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

## 👥 Team

Built for Avalanche Hackathon 2024

## 📄 License

MIT

---

**Note**: This project uses Avalanche Fuji testnet. All transactions are free and for demonstration purposes only.
# elaru
