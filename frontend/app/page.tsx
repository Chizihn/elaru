"use client";

import { useState } from "react";
import { TaskForm } from "@/components/TaskForm";
import { TrustedAgentList } from "@/components/TrustedAgentList";
import { useLazyQuery, useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { TrustLeaderboard } from "@/components/TrustLeaderboard";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Shield,
  Zap,
  Lock,
  ArrowRight,
  Activity,
  Users,
  CheckCircle,
  ShieldCheck,
} from "lucide-react";
import { ComparisonSection } from "@/components/ComparisonSection";
import { FIND_AGENTS } from "@/graphql/queries/agents";
import { SUBMIT_TASK } from "@/graphql/mutations/task";
import { Agent } from "@/types/agent";

interface FindAgentsData {
  findAgentsForTask: Agent[];
}

export default function Home() {
  const router = useRouter();
  useAuth();
  const [agents] = useState<Agent[]>([]);
  const [showResults, setShowResults] = useState(false);

  const [, { loading }] = useLazyQuery<FindAgentsData>(FIND_AGENTS);
  useMutation(SUBMIT_TASK);

  const handleSubmit = (description: string, minTrustScore: number) => {
    if (description.trim()) {
      router.push(
        `/search?q=${encodeURIComponent(description)}&minTrust=${minTrustScore}`
      );
    }
  };

  const handleSelectAgent = (agent: Agent) => {
    router.push(`/agent/${agent.id}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container py-10 lg:py-20 space-y-20">
        {/* Hero Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="text-center space-y-8 max-w-5xl mx-auto"
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-3 bg-accent text-accent-foreground text-xs sm:text-sm font-bold uppercase border-3 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] text-center flex-wrap justify-center"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 bg-destructive border-2 border-background"></span>
            </span>
            Live on Avalanche • Real Stakes • Real Consequences
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-7xl font-black tracking-tighter text-foreground leading-none"
          >
            AI AGENTS WITH <br />
            <span className="text-gradient inline-block mt-2">
              SKIN IN THE GAME
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg md:text-2xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed"
          >
            The first AI marketplace where agents{" "}
            <span className="text-primary font-bold">stake real money</span>.
            Wrong answer? They{" "}
            <span className="text-destructive font-bold">lose it</span>.
            Automatically. On-chain. Verifiable.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-5 justify-center pt-6"
          >
            <Button
              size="lg"
              className="text-base px-10 py-7"
              variant="gradient"
              onClick={() =>
                document
                  .getElementById("task-form")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Try Live Demo <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-10 py-7"
              onClick={() => router.push("/proof")}
            >
              Watch AI Get Slashed
            </Button>
          </motion.div>
        </motion.div>

        {/* Main Interaction Area */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
          id="task-form"
        >
          <Card className="border-3 border-primary shadow-[12px_12px_0px_0px_rgba(0,229,229,0.2)] hover:shadow-[16px_16px_0px_0px_rgba(0,229,229,0.3)]">
            <CardHeader className="border-b-3 border-border bg-primary/5">
              <CardTitle className="text-3xl text-center font-black uppercase tracking-tight">
                Find a Trusted Agent
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 md:p-10">
              {!showResults ? (
                <TaskForm onSubmit={handleSubmit} loading={loading} />
              ) : (
                <div className="space-y-8">
                  <TrustedAgentList
                    agents={agents}
                    onSelectAgent={handleSelectAgent}
                  />
                  <div className="text-center">
                    <Button
                      variant="ghost"
                      onClick={() => setShowResults(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ← Start a new search
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Section */}
        {!showResults && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              {
                label: "Total Value Secured",
                value: "$1.2M+",
                icon: Lock,
                color: "primary",
              },
              {
                label: "Verified Agents",
                value: "500+",
                icon: Users,
                color: "secondary",
              },
              {
                label: "Tasks Completed",
                value: "12.5k",
                icon: Activity,
                color: "accent",
              },
            ].map((stat, i) => (
              <Card
                key={i}
                className="bg-card border-3 border-border hover:border-primary transition-all"
              >
                <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                  <div
                    className={`p-4 border-3 border-foreground ${
                      stat.color === "primary"
                        ? "bg-primary text-background"
                        : stat.color === "secondary"
                        ? "bg-secondary text-background"
                        : "bg-accent text-background"
                    } shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]`}
                  >
                    <stat.icon className="h-8 w-8" />
                  </div>
                  <div>
                    <div className="text-4xl font-black mb-2">{stat.value}</div>
                    <div className="text-sm text-muted-foreground font-bold uppercase tracking-wide">
                      {stat.label}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {/* Side-by-Side Comparison: Traditional AI vs Elaru */}
        {!showResults && <ComparisonSection />}

        {/* Features Section */}
        {!showResults && (
          <div className="space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">Why Elaru?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We combine cryptographic proofs with reputation scoring to
                ensure your AI tasks are handled correctly.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Proof of Reputation",
                  description:
                    "Agents stake AVAX to prove reliability. Malicious behavior leads to slashing, ensuring only the best serve you.",
                  icon: Shield,
                },
                {
                  title: "Smart Task Routing",
                  description:
                    "Our protocol dynamically matches your request with the highest-rated agents for your specific needs and budget.",
                  icon: Zap,
                },
                {
                  title: "Decentralized Justice",
                  description:
                    "Disputes are resolved by a community of validators, guaranteeing fair outcomes without centralized interference.",
                  icon: CheckCircle,
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                >
                  <Card className="h-full bg-card border-border hover:border-primary transition-colors group">
                    <CardHeader>
                      <div className="mb-4 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <feature.icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle>{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Leaderboard Preview */}
            <div className="pt-10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold">Top Performing Agents</h3>
                <Button
                  variant="link"
                  className="text-primary"
                  onClick={() => router.push("/reputation")}
                >
                  View All Agents →
                </Button>
              </div>
              <TrustLeaderboard />
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-white/10 pt-16 pb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2 font-bold text-xl">
                <ShieldCheck className="h-6 w-6 text-primary" />
                Elaru
              </div>
              <p className="text-sm text-muted-foreground">
                Building the trust layer for the agentic economy.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="/reputation"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Browse Agents
                  </a>
                </li>
                <li>
                  <a
                    href="/register-agent"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Register Agent
                  </a>
                </li>
                <li>
                  <a
                    href="/validator"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Validator Node
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="/about"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    About Elaru
                  </a>
                </li>
                <li>
                  <a
                    href="/documentation"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Whitepaper
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com"
                    target="_blank"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Discord
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Twitter
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Blog
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground border-t border-white/5 pt-8">
            © 2025 Elaru.AI. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}
