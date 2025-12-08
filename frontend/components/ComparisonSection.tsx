'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  XCircle, 
  CheckCircle2, 
  CircleDollarSign, 
  ShieldX, 
  ShieldCheck,
  AlertTriangle,
  TrendingDown,
  Coins
} from 'lucide-react';

interface ComparisonItem {
  label: string;
  traditional: string;
  elaru: string;
  traditionalIcon?: React.ReactNode;
  elaruIcon?: React.ReactNode;
}

const comparisonData: ComparisonItem[] = [
  {
    label: "Economic Stake",
    traditional: "$0 at risk",
    elaru: "5+ AVAX staked",
    traditionalIcon: <CircleDollarSign className="h-4 w-4 text-muted-foreground" />,
    elaruIcon: <Coins className="h-4 w-4 text-emerald-500" />
  },
  {
    label: "Wrong Answer",
    traditional: "No consequences",
    elaru: "Automatic 0.5 AVAX slash",
    traditionalIcon: <XCircle className="h-4 w-4 text-muted-foreground" />,
    elaruIcon: <TrendingDown className="h-4 w-4 text-red-500" />
  },
  {
    label: "Accountability",
    traditional: "Trust the brand",
    elaru: "Verify on-chain",
    traditionalIcon: <ShieldX className="h-4 w-4 text-muted-foreground" />,
    elaruIcon: <ShieldCheck className="h-4 w-4 text-emerald-500" />
  },
  {
    label: "Cost to Lie",
    traditional: "$0",
    elaru: "$50+ per violation",
    traditionalIcon: <XCircle className="h-4 w-4 text-muted-foreground" />,
    elaruIcon: <AlertTriangle className="h-4 w-4 text-amber-500" />
  },
];

export function ComparisonSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="space-y-8"
    >
      {/* Section Header */}
      <div className="text-center space-y-4">
        <Badge variant="outline" className="px-4 py-1 border-primary/30 text-primary">
          Why We're Different
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold">
          Traditional AI vs <span className="text-primary">Elaru</span>
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          ChatGPT can lie without consequences. On Elaru, AI agents have skin in the game.
        </p>
      </div>

      {/* Comparison Cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {/* Traditional AI Card */}
        <Card className="border-border bg-card/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent" />
          <CardHeader className="relative">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <ShieldX className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <CardTitle className="text-xl">Traditional AI</CardTitle>
                <p className="text-sm text-muted-foreground">ChatGPT, Claude, etc.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative space-y-4">
            {comparisonData.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
              >
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <div className="flex items-center gap-2">
                  {item.traditionalIcon}
                  <span className="text-sm font-medium">{item.traditional}</span>
                </div>
              </motion.div>
            ))}
            
            {/* Bottom Summary */}
            <div className="pt-4 mt-4 border-t border-border">
              <div className="flex items-center justify-center gap-2 text-red-500">
                <XCircle className="h-5 w-5" />
                <span className="font-semibold">No Economic Accountability</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Elaru Card */}
        <Card className="border-primary/30 bg-card/50 relative overflow-hidden ring-1 ring-primary/20">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
          <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-bl-lg">
            RECOMMENDED
          </div>
          <CardHeader className="relative">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Elaru.AI</CardTitle>
                <p className="text-sm text-muted-foreground">Accountable AI Agents</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative space-y-4">
            {comparisonData.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
              >
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <div className="flex items-center gap-2">
                  {item.elaruIcon}
                  <span className="text-sm font-medium text-foreground">{item.elaru}</span>
                </div>
              </motion.div>
            ))}
            
            {/* Bottom Summary */}
            <div className="pt-4 mt-4 border-t border-border">
              <div className="flex items-center justify-center gap-2 text-emerald-500">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">Real Economic Consequences</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Tagline */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
        className="text-center pt-8"
      >
        <p className="text-xl font-medium text-muted-foreground">
          "Which AI would <span className="text-primary font-bold">YOU</span> trust with your money?"
        </p>
      </motion.div>
    </motion.div>
  );
}
