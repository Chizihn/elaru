import { request, gql } from 'graphql-request';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const GRAPHQL_ENDPOINT = 'http://localhost:4000/graphql';

// --- GraphQL Queries & Mutations ---

const REGISTER_AGENT_MUTATION = gql`
  mutation RegisterAgent($walletAddress: String!, $serviceType: String!, $endpoint: String!, $description: String!, $pricePerRequest: String!, $responseType: String) {
    registerAgent(walletAddress: $walletAddress, serviceType: $serviceType, endpoint: $endpoint, description: $description, pricePerRequest: $pricePerRequest, responseType: $responseType) {
      id
      walletAddress
      name
      responseType
    }
  }
`;

const GET_AGENT_BY_WALLET_QUERY = gql`
  query GetAgentByWallet($walletAddress: String!) {
    getAgentByWallet(walletAddress: $walletAddress) {
      id
      name
      reputationScore
    }
  }
`;

const GET_AGENT_TASKS_QUERY = gql`
  query GetAgentTasks($agentId: String!, $status: String) {
    getAgentTasks(agentId: $agentId, status: $status) {
      id
      description
      status
      user {
        walletAddress
      }
    }
  }
`;

const COMPLETE_TASK_MUTATION = gql`
  mutation CompleteTask($taskId: String!, $result: String!) {
    completeTask(taskId: $taskId, result: $result) {
      id
      status
      result
    }
  }
`;

// --- Mock Agent Configuration ---

const AGENT_CONFIG = {
  name: "Social Media Manager Pro",
  serviceType: "Social Media",
  description: "I post high-engagement content to Twitter/X and LinkedIn. 24/7 uptime.",
  pricePerRequest: "0.1", // USDC
  endpoint: "http://localhost:8000/api/v1/agent", // Placeholder
};

// --- Main Logic ---

async function main() {
  console.log("🤖 Starting Mock Social Media Agent...");

  // 1. Setup Wallet (Simulated)
  // In a real scenario, this would be the agent's private key
  // For this demo, we'll generate a random one or use a fixed one if provided
  const privateKey = process.env.MOCK_AGENT_PRIVATE_KEY || ethers.Wallet.createRandom().privateKey;
  const wallet = new ethers.Wallet(privateKey);
  console.log(`🔑 Agent Wallet Address: ${wallet.address}`);

  try {
    // 2. Check Registration
    let agentId: string;
    console.log("🔍 Checking if agent is registered...");
    
    try {
      const data: any = await request(GRAPHQL_ENDPOINT, GET_AGENT_BY_WALLET_QUERY, {
        walletAddress: wallet.address
      });
      
      if (data.getAgentByWallet) {
        console.log(`✅ Agent found! ID: ${data.getAgentByWallet.id}, Reputation: ${data.getAgentByWallet.reputationScore}`);
        agentId = data.getAgentByWallet.id;
      } else {
        console.log("⚠️ Agent not found. Registering...");
        const regData: any = await request(GRAPHQL_ENDPOINT, REGISTER_AGENT_MUTATION, {
          walletAddress: wallet.address,
          serviceType: AGENT_CONFIG.serviceType,
          endpoint: AGENT_CONFIG.endpoint,
          description: AGENT_CONFIG.description,
          pricePerRequest: AGENT_CONFIG.pricePerRequest,
          responseType: "MARKDOWN"
        });
        agentId = regData.registerAgent.id;
        console.log(`🎉 Registration successful! Agent ID: ${agentId}`);
      }
    } catch (error) {
      // If error is "Agent not found" (depending on resolver implementation), handle it.
      // Assuming the query returns null or throws. 
      // For simplicity, we'll assume if it fails, we might need to register or it's a connection error.
      console.error("Error checking/registering agent:", error);
      return;
    }

    // 3. Start Polling Loop
    console.log("📡 Starting Task Polling Loop (every 5s)...");
    
    setInterval(async () => {
      try {
        // Fetch PENDING tasks
        // Note: The GraphQL schema expects TaskStatus enum, but passing string usually works if mapped correctly.
        // If strict, we might need to fix the query to use Enum.
        const data: any = await request(GRAPHQL_ENDPOINT, GET_AGENT_TASKS_QUERY, {
          agentId: agentId,
          status: "PENDING" // Assuming TaskStatus.PENDING maps to this string
        });

        const tasks = data.getAgentTasks || [];

        if (tasks.length > 0) {
          console.log(`📬 Found ${tasks.length} new tasks!`);
          
          for (const task of tasks) {
            await processTask(task);
          }
        } else {
          // console.log("zzz... No tasks found.");
        }

      } catch (error) {
        console.error("❌ Error polling tasks:", error);
      }
    }, 5000);

  } catch (error) {
    console.error("❌ Fatal Agent Error:", error);
  }
}

async function processTask(task: any) {
  console.log(`\n▶️ Processing Task ${task.id}: "${task.description}"`);
  
  // Simulate AI work (delay)
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Generate Mock Result
  const result = generateMockResponse(task.description);
  console.log(`✅ Work Complete. Result: "${result}"`);

  // Submit Result
  try {
    await request(GRAPHQL_ENDPOINT, COMPLETE_TASK_MUTATION, {
      taskId: task.id,
      result: result
    });
    console.log(`🚀 Result submitted to platform.\n`);
  } catch (error) {
    console.error(`❌ Failed to submit result for task ${task.id}:`, error);
  }
}

function generateMockResponse(description: string): string {
  const descLower = description.toLowerCase();

  // 1. Image Generation Task (Logo, Design)
  if (descLower.includes("logo") || descLower.includes("design") || descLower.includes("image")) {
    return `### 🎨 Here is your design

I have generated a concept for "${description}".

![Generated Design](https://via.placeholder.com/600x400.png?text=AI+Generated+Design)

**Specs:**
*   Resolution: 1024x1024
*   Style: Minimalist
*   Format: PNG
`;
  }

  // 2. Code Generation Task (Smart Contract, Script)
  if (descLower.includes("code") || descLower.includes("contract") || descLower.includes("script") || descLower.includes("function")) {
    return `### 💻 Generated Code

Here is the TypeScript implementation for your request:

\`\`\`typescript
interface User {
  id: string;
  name: string;
}

function processUser(user: User) {
  console.log(\`Processing \${user.name}...\`);
  return true;
}
\`\`\`

To run this, make sure you have \`typescript\` installed.
`;
  }

  // 3. Default: Social Media / Text
  const templates = [
    "### 🚀 Social Media Draft\n\nJust posted to Twitter:\n\n> 🚀 **{topic}** is the future! The AI economy is booming. #Crypto #AI #Avalanche",
    "### 💼 LinkedIn Update\n\nExcited to share thoughts on **{topic}**.\n\n*   Point 1: Innovation is key\n*   Point 2: Decentralization matters\n\nRead more below...",
    "### 🐦 Tweet\n\nDid you know **{topic}**? 🤯\n\nCheck out [Elaru](https://elaru.ai) for more info! #TechTrends",
  ];
  
  const topic = description.replace("Post about ", "").replace("Write a tweet about ", "") || "AI Agents";
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  return template.replace("{topic}", topic);
}

// Start
main();
