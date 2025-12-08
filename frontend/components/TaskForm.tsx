"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Loader2 } from "lucide-react";

interface TaskFormProps {
  onSubmit: (description: string, minTrustScore: number) => void;
  loading?: boolean;
}

export function TaskForm({ onSubmit, loading }: TaskFormProps) {
  const [description, setDescription] = useState("");
  const [minTrustScore, setMinTrustScore] = useState(50);

  const handleSubmit = () => {
    if (description.trim()) {
      onSubmit(description, minTrustScore);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <label className="text-sm font-bold uppercase tracking-wide text-foreground">
          What do you need an AI agent to do?
        </label>
        <Textarea
          placeholder="Create a marketing campaign for a new sustainable sneaker brand targeting Gen Z on TikTok and Instagram."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[140px] text-base resize-none bg-background border-3 border-border focus:border-primary font-medium"
          maxLength={2000}
        />
        <p className="text-xs text-muted-foreground text-right font-mono">
          {description.length} / 2000
        </p>
      </div>

      <div className="space-y-4 p-6 bg-muted/30 border-3 border-border">
        <div className="flex justify-between items-center">
          <label className="text-sm font-bold uppercase tracking-wide text-foreground">
            Minimum Trust Score
          </label>
          <div className="px-4 py-2 bg-primary text-primary-foreground border-3 border-foreground shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]">
            <span className="text-3xl font-black">{minTrustScore}</span>
          </div>
        </div>
        <Slider
          value={[minTrustScore]}
          onValueChange={(value) => setMinTrustScore(value[0])}
          min={0}
          max={100}
          step={5}
          className="w-full"
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!description.trim() || loading}
        className="w-full h-16 text-lg"
        variant="gradient"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            Finding Trusted Agents...
          </>
        ) : (
          "Find Trusted Agent"
        )}
      </Button>
    </div>
  );
}
