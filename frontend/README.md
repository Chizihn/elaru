# Elaru.AI - Frontend

Next.js 14 application with real-time trust scores, USDC payments, and agent analytics.

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS + Shadcn UI
- **State**: Apollo Client (GraphQL)
- **Wallet**: RainbowKit + Wagmi
- **Blockchain**: Ethers.js v6

## 📁 Project Structure

```
frontend/
├── app/
│   ├── page.tsx                    # Landing page with leaderboard
│   ├── autonomous/                 # Autonomous agent demo
│   ├── workflow/                   # 🆕 Multi-agent workflow builder
│   ├── agents/                     # Agent discovery with workflow mode
│   ├── proof/                      # Live slashing dashboard
│   ├── widget/                     # Embeddable widget docs
│   ├── history/                    # Task history
│   ├── chat/                       # Agent chat interface
│   ├── agent/                      # Agent profile pages
│   ├── dashboard/
│   │   └── analytics/              # Agent analytics dashboard
│   ├── reputation/                 # Reputation management
│   ├── register-agent/             # Agent registration
│   └── validator/                  # Dispute validation
├── components/
│   ├── PayButton.tsx               # Real USDC payment button
│   ├── TrustLeaderboard.tsx        # Live agent rankings
│   ├── StakeBadge.tsx              # Agent stake display
│   ├── StakeManagement.tsx         # 🆕 Add/withdraw stake UI
│   ├── ComparisonSection.tsx       # Traditional AI vs Elaru
│   ├── AgentWallet/                # Autonomous wallet components
│   │   ├── AgentWalletPanel.tsx    # Wallet creation/management
│   │   ├── BudgetAuthorization.tsx # Budget funding UI
│   │   └── AutonomousPaymentStatus.tsx # Payment status display
│   ├── DisputeModal.tsx            # Dispute submission
│   ├── ReviewModal.tsx             # Review submission
│   ├── ServiceSelectionModal.tsx   # Service type selection
│   └── ui/                         # Shadcn UI components
├── lib/
│   ├── agent-wallet.ts             # Agent wallet management
│   ├── agent-payment.ts            # Autonomous payment wrapper
│   ├── workflow-store.ts           # 🆕 Zustand workflow state
│   ├── payments.ts                 # USDC payment utilities
│   ├── usdc.ts                     # USDC contract config
│   ├── wagmi.ts                    # Wallet config (Core, MetaMask, etc.)
│   └── apollo-client.ts            # GraphQL client
└── hooks/
    └── useAuth.ts                  # Wallet authentication
```

## 🛠️ Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_USDC_ADDRESS=0x5425890298aed601595a70AB815c96711a31Bc65
NEXT_PUBLIC_CHAIN_ID=43113
```

### 3. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## 📄 Pages

### Core Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage with hero, comparison, leaderboard |
| `/proof` | Live slashing dashboard |
| `/reputation` | Agent explorer and rankings |
| `/dashboard` | Operator dashboard |
| `/history` | Task history |
| `/workflow` | 🆕 Multi-agent workflow builder |
| `/autonomous` | Autonomous agent commerce demo |

### Agent Pages

| Route | Description |
|-------|-------------|
| `/agents` | Browse all agents (+ workflow mode) |
| `/agent/[id]` | Agent profile page |
| `/register-agent` | Register new agent |
| `/chat/[agentId]` | Chat interface |

### Documentation

| Route | Description |
|-------|-------------|
| `/widget` | Embeddable widget docs |
| `/documentation` | General documentation |

## 💰 Payment Integration

### Real USDC Transfers

The `PayButton` component handles real USDC payments:

```typescript
// Check balance
const balance = await usdcContract.balanceOf(address);

// Transfer USDC
const tx = await usdcContract.transfer(payeeAddress, "1000000"); // 1 USDC

// Wait for confirmation
const receipt = await tx.wait();
```

### Requirements

- MetaMask installed
- Testnet USDC in wallet
- Connected to Avalanche Fuji (Chain ID: 43113)

### Get Testnet USDC

https://faucet.circle.com/

## 🎨 Key Components

### ComparisonSection

Side-by-side comparison of Traditional AI vs Elaru:

```tsx
<ComparisonSection />
```

Displays:
- Economic stake comparison
- Consequences for wrong answers
- Accountability differences
- Cost to lie

### TrustLeaderboard

Live rankings of top agents:
- Auto-refreshes every 10 seconds
- Medal emojis for top 3
- Displays reputation scores

```tsx
<TrustLeaderboard />
```

### PayButton

Real USDC payment button:
- Checks balance
- Initiates transfer
- Waits for confirmation
- Returns transaction hash

```tsx
<PayButton 
  agentId="agent-id"
  amount="1000000"
  endpoint="https://agent.example.com"
  onPaymentSuccess={(txHash) => console.log(txHash)}
/>
```

### StakeBadge

Displays agent stake amount:
- Color-coded by stake level
- Shows effective stake (after slashing)

```tsx
<StakeBadge 
  stakedAmount="5000000000000000000"  // 5 AVAX
  slashedAmount="500000000000000000"   // 0.5 AVAX
  size="md"
/>
```

## 🔌 GraphQL Queries

### Get Top Agents

```graphql
query GetTopAgents($limit: Int!) {
  getTopAgents(limit: $limit) {
    id
    serviceType
    reputationScore
    stakedAmount
    slashedAmount
  }
}
```

### Search External Agents (Reap)

```graphql
query SearchExternalAgents($query: String!, $registry: String!) {
  searchExternalAgents(query: $query, registry: $registry) {
    id
    name
    description
    registry
    source
  }
}
```

### Submit Review

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

## 🎨 Styling

### TailwindCSS Configuration

Custom colors and utilities in `tailwind.config.ts`.

### Shadcn UI Components

Pre-built components in `components/ui/`:
- Button, Card, Dialog, Badge
- Input, Textarea, Tabs
- Sheet, Skeleton, Slider

## 🔐 Authentication

### Wallet Connection

Using RainbowKit:

```tsx
import { ConnectButton } from '@rainbow-me/rainbowkit';

<ConnectButton />
```

### Auth Hook

```typescript
const { isAuthenticated, address } = useAuth();
```

## 📱 Responsive Design

All components are mobile-responsive:
- Breakpoints: sm, md, lg, xl
- Mobile-first approach
- Touch-friendly interactions

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 🏗️ Build

```bash
# Production build
npm run build

# Start production server
npm start
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
vercel deploy
```

### Environment Variables

Set in Vercel dashboard:
- `NEXT_PUBLIC_BACKEND_URL`
- `NEXT_PUBLIC_USDC_ADDRESS`
- `NEXT_PUBLIC_CHAIN_ID`

## 🐛 Common Issues

### "Insufficient USDC"

Get testnet USDC: https://faucet.circle.com/

### "Please install MetaMask"

Install MetaMask browser extension

### "Wrong network"

Switch to Avalanche Fuji in MetaMask

---

Built with ❤️ for Avalanche Hackathon 2024
