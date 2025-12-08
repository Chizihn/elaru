# Elaru.AI - Smart Contracts

Solidity smart contracts for agent staking, identity, and reputation management on Avalanche.

## 🚀 Tech Stack

- **Framework**: Hardhat
- **Language**: Solidity ^0.8.20
- **Network**: Avalanche Fuji Testnet
- **Testing**: Hardhat + Chai

## 📁 Project Structure

```
smart-contract/
├── contracts/
│   ├── AgentStaking.sol       # Staking & slashing logic
│   ├── IdentityRegistry.sol   # Agent identity NFTs
│   ├── ReputationRegistry.sol # ERC-8004 reputation
│   └── ValidationRegistry.sol # Review validation
├── scripts/
│   ├── deploy.ts              # Deploy all contracts
│   ├── check-agent.ts         # Check agent status
│   └── register-agents.ts     # Register initial agents
├── hardhat.config.ts          # Hardhat configuration
└── DEPLOYMENT.md              # Deployment guide
```

## 📜 Contracts

### AgentStaking.sol

Manages agent stakes and automatic slashing.

**Key Constants:**
- `MINIMUM_STAKE`: 0.5 AVAX
- `SLASH_AMOUNT`: 0.5 AVAX per violation

**Functions:**

| Function | Description |
|----------|-------------|
| `stake(name, description, serviceType, endpoint)` | Stake AVAX and mint identity NFT |
| `addStake()` | Add more stake to existing position |
| `slash(agent, reason)` | Slash agent's stake (treasury receives funds) |
| `withdraw(amount)` | Withdraw stake (must maintain minimum) |
| `getStake(agent)` | Get agent's current stake |
| `hasMinimumStake(agent)` | Check if agent has sufficient stake |

**Events:**
```solidity
event Staked(address indexed agent, uint256 amount, uint256 totalStake);
event Slashed(address indexed agent, uint256 amount, string reason, uint256 remainingStake);
event SlashedToTreasury(address indexed agent, uint256 amount, address treasury);
event Withdrawn(address indexed agent, uint256 amount);
```

### IdentityRegistry.sol

Manages agent identity as NFTs.

**Functions:**
- `registerAgent(address, name, description, serviceType, endpoint)` - Register new agent
- `getAgent(address)` - Get agent details
- `updateAgent(...)` - Update agent metadata

### ReputationRegistry.sol

ERC-8004 compliant reputation tracking.

**Functions:**
- `updateScore(address agent, int256 delta)` - Adjust reputation score
- `getScore(address agent)` - Get current score
- `getHistory(address agent)` - Get score history

### ValidationRegistry.sol

Handles review validation.

**Functions:**
- `submitReview(address agent, uint8 rating, string evidence)` - Submit review
- `validateReview(uint256 reviewId)` - AI judge validates review
- `getReviewStatus(uint256 reviewId)` - Check review status

## 🛠️ Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create `.env`:

```env
FUJI_RPC_URL="https://api.avax-test.network/ext/bc/C/rpc"
FUJI_PRIVATE_KEY="your_private_key_here"
```

### 3. Compile Contracts

```bash
npx hardhat compile
```

## 🚀 Deployment

### Deploy to Fuji Testnet

```bash
npx hardhat run scripts/deploy.ts --network fuji
```

**Output:**
```
IdentityRegistry deployed to: 0x...
ReputationRegistry deployed to: 0x...
ValidationRegistry deployed to: 0x...
AgentStaking deployed to: 0x...
```

### Register Initial Agents

```bash
npx hardhat run scripts/register-agents.ts --network fuji
```

## 📍 Deployed Addresses (Fuji)

| Contract | Address |
|----------|---------|
| IdentityRegistry | `0xA58A547D8Cce114264F84453Ae876A5CBf5023BE` |
| ReputationRegistry | `0xacC5A4F6c7b7EedCb8B2B08267b298FceE5D938A` |
| ValidationRegistry | `0x7494e893a1b36837FD960F7a56942De3DbFA2aCC` |
| AgentStaking | `0x5882fDA43825b948B13590bdbaEb67dD06542be6` |

## 🧪 Testing

```bash
# Run all tests
npx hardhat test

# Run with coverage
npx hardhat coverage

# Run specific test
npx hardhat test test/AgentStaking.test.ts
```

## 📊 Check Agent Status

```bash
npx hardhat run scripts/check-agent.ts --network fuji
```

**Sample Output:**
```
Agent: 0x...
Stake: 9.5 AVAX (after slashing)
Slashed Total: 0.5 AVAX
Is Active: true
```

## 🔍 Verification

Verify contracts on Snowtrace:

```bash
npx hardhat verify --network fuji CONTRACT_ADDRESS CONSTRUCTOR_ARGS
```

View on Snowtrace: https://testnet.snowtrace.io/

## 🔒 Security Considerations

- Only `reputationContract` or `owner` can call `slash()`
- Minimum stake enforced on withdrawal
- Treasury address cannot be zero
- Slashed funds immediately transferred to treasury

## 🐛 Common Issues

### "Insufficient stake amount"
Stake at least 0.5 AVAX (MINIMUM_STAKE)

### "Only reputation contract"
Set reputation contract address after deployment:
```solidity
agentStaking.setReputationContract(reputationRegistryAddress);
```

### "Treasury transfer failed"
Ensure treasury address can receive AVAX

---

Built with ❤️ for Avalanche Hackathon 2024
