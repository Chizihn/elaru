"use client";

import { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ArtifactRendererProps {
  language: string;
  code: string;
  className?: string;
}

export function ArtifactRenderer({
  language,
  code,
  className,
}: ArtifactRendererProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code", err);
    }
  };

  return (
    <div className={cn("my-4 rounded-xl border border-border bg-card overflow-hidden shadow-sm", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
            <div className="bg-background p-1 rounded-md border border-border">
             <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {language || "text"}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
          onClick={handleCopy}
          title="Copy code"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      {/* Code Area */}
      <div className="p-4 overflow-x-auto bg-[#0d1117]"> {/* Github dark theme bg approximation */}
        <pre className="!bg-transparent !p-0 !m-0 font-mono text-sm leading-relaxed">
          <code className={cn("language-" + language, "bg-transparent")}>
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
}
