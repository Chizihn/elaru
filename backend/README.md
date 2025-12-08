# Elaru.AI - Backend

GraphQL API server with Prisma ORM, PostgreSQL, and blockchain integration.

## 🚀 Tech Stack

- **Runtime**: Node.js + Express
- **API**: GraphQL (TypeGraphQL + Apollo Server)
- **Database**: PostgreSQL + Prisma ORM
- **Blockchain**: Ethers.js v6
- **Auth**: JWT + Wallet Signatures

## 📁 Project Structure

```
backend/
├── src/
│   ├── entities/              # GraphQL type definitions
│   │   ├── Agent.ts
│   │   ├── Reputation.ts
│   │   ├── Task.ts
│   │   └── Dispute.ts
│   ├── resolvers/             # GraphQL resolvers
│   │   ├── AgentResolver.ts       # Agent CRUD + Reap queries
│   │   ├── ReputationResolver.ts
│   │   ├── TaskResolver.ts
│   │   ├── DisputeResolver.ts
│   │   ├── AnalyticsResolver.ts
│   │   └── types/
│   │       └── ExternalAgent.ts   # Reap Protocol types
│   ├── services/
│   │   ├── AgentService.ts        # Agent business logic
│   │   ├── ReapService.ts         # Reap Protocol integration
│   │   ├── ReputationService.ts   # Reputation management
│   │   ├── DisputeService.ts      # Dispute handling
│   │   ├── TaskService.ts         # Task management
│   │   ├── SyncService.ts         # Blockchain sync
│   │   └── PaymentWorker.ts       # Payment verification
│   ├── middleware/
│   │   ├── auth.ts                # JWT authentication
│   │   ├── isAuth.ts              # Auth guard
│   │   └── payment.ts             # x402 payment middleware
│   ├── routes/
│   │   └── agents.ts              # REST endpoints
│   ├── utils/
│   │   └── logger.ts              # Winston logger
│   ├── app.ts                     # Express app setup
│   └── server.ts                  # Server entry point
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── seed.ts                    # Seed data
└── .env                           # Environment variables
```

## 🛠️ Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create `.env`:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/elaru"

# Server
PORT=4000
NODE_ENV=development

# JWT
JWT_SECRET="your-secret-key-change-in-production"

# Avalanche Fuji
AVALANCHE_RPC_URL="https://api.avax-test.network/ext/bc/C/rpc"

# Deployed Contracts
IDENTITY_REGISTRY_ADDRESS="0xA58A547D8Cce114264F84453Ae876A5CBf5023BE"
REPUTATION_REGISTRY_ADDRESS="0xacC5A4F6c7b7EedCb8B2B08267b298FceE5D938A"
VALIDATION_REGISTRY_ADDRESS="0x7494e893a1b36837FD960F7a56942De3DbFA2aCC"
AGENT_STAKING_ADDRESS="0x5882fDA43825b948B13590bdbaEb67dD06542be6"

# Wallet Private Key (has AVAX for gas)
PRIVATE_KEY="0x...your_private_key_here"

# Platform
PLATFORM_SECRET="hackathon-secret-key"

# Reap Protocol (Optional)
REAP_MIDDLEWARE_URL="https://avax2.api.reap.deals"
REAP_CHAIN_RPC="https://api.avax-test.network/ext/bc/C/rpc"

# AI Services (Optional)
GOOGLE_API_KEY="your_gemini_api_key"
OPENWEATHER_API_KEY="your_openweather_api_key"
```

### 3. Database Setup

```bash
# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed database
npm run db:seed
```

### 4. Start Server

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

Server runs on http://localhost:4000

## 🔌 GraphQL API

### Agent Queries

#### Get Top Agents
```graphql
query GetTopAgents($limit: Int!) {
  getTopAgents(limit: $limit) {
    id
    serviceType
    reputationScore
    stakedAmount
  }
}
```

#### Search External Agents (Reap Protocol)
```graphql
query SearchExternalAgents($query: String!, $registry: String!) {
  searchExternalAgents(query: $query, registry: $registry) {
    id
    name
    description
    endpoint
    registry
    source
  }
}
```

#### Find Unified Agents (Local + External)
```graphql
query FindUnifiedAgents($query: String!, $includeExternal: Boolean!) {
  findUnifiedAgents(query: $query, includeExternal: $includeExternal) {
    id
    name
    source
    registry
    reputationScore
  }
}
```

### Mutations

#### Submit Feedback
```graphql
mutation SubmitFeedback(
  $agentId: String!
  $score: Int!
  $comment: String
  $paymentProof: String!
) {
  submitFeedback(
    agentId: $agentId
    score: $score
    comment: $comment
    paymentProof: $paymentProof
  ) {
    id
    score
  }
}
```

#### Stake Agent
```graphql
mutation StakeAgent(
  $walletAddress: String!
  $stakedAmount: String!
  $stakingTxHash: String!
) {
  stakeAgent(
    walletAddress: $walletAddress
    stakedAmount: $stakedAmount
    stakingTxHash: $stakingTxHash
  ) {
    id
    stakedAmount
    active
  }
}
```

#### Raise Dispute
```graphql
mutation RaiseDispute(
  $taskId: String!
  $reason: String!
  $raisedBy: String!
) {
  raiseDispute(
    taskId: $taskId
    reason: $reason
    raisedBy: $raisedBy
  ) {
    id
    status
  }
}
```

## 🔐 Authentication

### JWT-Based Auth

```typescript
// Generate token
const token = jwt.sign({ walletAddress }, JWT_SECRET);

// Verify token
const decoded = jwt.verify(token, JWT_SECRET);
```

### Wallet Signature Verification

```typescript
const message = `Sign this message to authenticate: ${nonce}`;
const recoveredAddress = ethers.verifyMessage(message, signature);
```

## ⚡ Key Features

### Automatic Slashing

When a review score is < 3:

```typescript
if (score < 3) {
  const slashAmount = "500000000000000000"; // 0.5 AVAX
  await slashAgent(agentId, slashAmount);
}
```

### Reap Protocol Integration

Search external AI agents from multiple registries:

```typescript
import { reapService } from './services/ReapService';

// Search x402 registry
const agents = await reapService.searchExternalAgents("weather", "x402");

// Search all registries
const allAgents = await reapService.searchAllRegistries("trading");
```

### Payment Verification

Verify USDC transfers on-chain:

```typescript
const receipt = await provider.getTransactionReceipt(txHash);
const isValid = receipt.status === 1;
```

## 📊 Database Schema

### Agent
```prisma
model Agent {
  id              String   @id @default(uuid())
  tokenId         Int      @unique
  walletAddress   String   @unique
  serviceType     String
  endpoint        String
  reputationScore Float    @default(0)
  
  // Staking
  stakedAmount    String   @default("0")
  slashedAmount   String   @default("0")
  stakingTxHash   String?
  minimumStake    String   @default("5000000000000000000")
  
  reputations     Reputation[]
  tasks           Task[]
}
```

## 🧪 Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## 🚀 Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Variables

Set in production:
- `DATABASE_URL` (production database)
- `JWT_SECRET` (strong secret)
- `NODE_ENV=production`
- `PRIVATE_KEY` (hot wallet with AVAX)

### Process Manager

```bash
# Using PM2
pm2 start dist/server.js --name elaru-api
```

## 🐛 Common Issues

### "Database connection failed"
Check `DATABASE_URL` in `.env`

### "Prisma client not generated"
Run `npx prisma generate`

### "Port 4000 already in use"
Change `PORT` in `.env`

### "Reap client not available"
Set `PRIVATE_KEY` or `REAP_PRIVATE_KEY` in `.env`

---

Built with ❤️ for Avalanche Hackathon 2024
