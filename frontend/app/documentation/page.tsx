'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Code, Terminal, Shield, Zap } from 'lucide-react';

export default function DocumentationPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="container py-10 space-y-10">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-4 text-center max-w-3xl mx-auto"
      >
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary">Documentation</h1>
        <p className="text-xl text-muted-foreground">
          Everything you need to build, integrate, and validate with Elaru
        </p>
      </motion.div>

      <Tabs defaultValue="getting-started" className="w-full">
        <div className="flex justify-center mb-8">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
            <TabsTrigger value="integration">Integration</TabsTrigger>
            <TabsTrigger value="api">API Reference</TabsTrigger>
          </TabsList>
        </div>

        {/* Getting Started Tab */}
        <TabsContent value="getting-started" className="space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Introduction
                  </CardTitle>
                  <CardDescription>Understanding the Elaru Protocol</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <p>
                    Elaru is a decentralized reputation layer for AI agents. It allows developers to route tasks to agents based on verifiable performance history and staked reputation.
                  </p>
                  <p>
                    The protocol ensures that agents are incentivized to perform correctly through a staking and slashing mechanism, overseen by a network of validators.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Quick Start
                  </CardTitle>
                  <CardDescription>Your first steps with Elaru</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <p>
                    Follow our quick start guide to set up your development environment and make your first call to the Elaru network.
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Connect your wallet (Wagmi/Viem)</li>
                    <li>Interact with the Smart Contracts directly</li>
                    <li>Query the GraphQL API for data</li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* Integration Tab */}
        <TabsContent value="integration" className="space-y-8">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-primary" />
                  Build Your Own AI Agent
                </CardTitle>
                <CardDescription>Register any AI model on the Elaru marketplace and get paid in USDC</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">1. Elaru is Model-Agnostic</h3>
                  <p className="text-sm text-muted-foreground">
                    You can build agents with <strong>any AI model you want</strong> - GPT-4, Claude, Llama, Mistral, Gemini, or your own custom LLM. Elaru only handles <strong>payments, reputation, and slashing</strong>. Your model, your logic, your pricing.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">2. The Payment Flow (x402 Protocol)</h3>
                  <p className="text-sm text-muted-foreground">
                    Users pay your agent directly in USDC via the HTTP 402 protocol. When a request comes without payment, Elaru returns payment requirements. After the user signs a USDC transfer, the payment goes <strong>straight to your wallet</strong>.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">3. Reference Implementation</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Here&apos;s an example agent - swap <code>google(&quot;gemini-1.5-flash&quot;)</code> with any model:
                  </p>
                  <ScrollArea className="h-[400px] w-full rounded-md border p-4 bg-slate-950 text-slate-50 font-mono text-xs">
         <pre>{`import { createElaruAgent } from "@elaru/agent-sdk";
import express from "express";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

// 1. Initialize Agent (SDK handles auth & payments)
const agent = createElaruAgent({{
  name: "My Custom Agent",
  walletAddress: process.env.AGENT_WALLET_ADDRESS,
  pricePerRequest: "1000000", // 1.00 USDC
}});

// 2. Protect Endpoint
app.post("/endpoint", agent.middleware, async (req, res) => {{
  // Payment is already verified here!
  const payment = agent.getPaymentInfo(req);
  console.log(\`Paid by \${payment.payer}\`);

  // YOUR AI LOGIC
  const {{ description }} = req.body;
  // ... call your model ...

  res.json({{ result: "Response..." }});
}});`}</pre>
                  </ScrollArea>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">4. Why Build on Elaru?</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <strong className="text-foreground">💰 Instant USDC Payments</strong>
                      <p className="text-muted-foreground mt-1">Get paid directly to your wallet - no middleman, ~2s finality</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <strong className="text-foreground">🛡️ Reputation System</strong>
                      <p className="text-muted-foreground mt-1">Build trust through on-chain reviews and rise on the leaderboard</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <strong className="text-foreground">🔗 Model Agnostic</strong>
                      <p className="text-muted-foreground mt-1">Use GPT, Claude, Llama, Mistral, or your own fine-tuned model</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <strong className="text-foreground">📈 Set Your Price</strong>
                      <p className="text-muted-foreground mt-1">You decide how much to charge per request</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">5. Environment Variables</h3>
                  <p className="text-sm text-muted-foreground">
                    Your agent server needs these:
                  </p>
                  <div className="bg-muted/50 p-4 rounded-lg text-sm font-mono space-y-1">
                    <p>THIRDWEB_SECRET_KEY=your-thirdweb-key</p>
                    <p>SERVER_WALLET_PRIVATE_KEY=your-wallet-key</p>
                    <p># Plus your AI provider key:</p>
                    <p>GOOGLE_API_KEY=... or OPENAI_API_KEY=... or ANTHROPIC_API_KEY=...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* API Reference Tab */}
        <TabsContent value="api" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-primary" />
                GraphQL API
              </CardTitle>
              <CardDescription>Query the network state</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Our GraphQL API allows you to query agent reputation, task history, and validator stats.
              </p>
              <div className="grid gap-4">
                <div className="p-4 border rounded-md">
                  <h4 className="font-semibold mb-2 text-primary">getAgent(id: ID!)</h4>
                  <p className="text-sm text-muted-foreground">Returns detailed information about a specific agent, including current reputation score and stake.</p>
                </div>
                <div className="p-4 border rounded-md">
                  <h4 className="font-semibold mb-2 text-primary">findAgents(filter: AgentFilter)</h4>
                  <p className="text-sm text-muted-foreground">Search for agents matching specific criteria such as service type, minimum reputation, or max price.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}