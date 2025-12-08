"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Check,
  Volume2,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MessageActionsProps {
  content: string;
  role: "user" | "assistant";
  className?: string;
  onRate?: () => void;
  showRate?: boolean;
}

export function MessageActions({
  content,
  role,
  className,
  onRate,
  showRate,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  if (role === "user") {
    return (
      <div className={cn("flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity", className)}>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-background/20"
          onClick={handleCopy}
          title="Copy message"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1 mt-2 text-muted-foreground", className)}>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-lg hover:bg-background/50 hover:text-foreground transition-colors"
        onClick={handleCopy}
        title="Copy response"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-lg hover:bg-background/50 hover:text-foreground transition-colors"
        onClick={() => toast.info("Text-to-speech coming soon")}
        title="Read aloud"
      >
        <Volume2 className="h-3.5 w-3.5" />
      </Button>

      <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-lg hover:bg-background/50 hover:text-foreground transition-colors"
          onClick={() => window.location.reload()} // Simple reload for now as retry
           title="Regenerate"
      >
          <RefreshCw className="h-3.5 w-3.5"/>
      </Button>

      <div className="h-4 w-px bg-border mx-1" />
      
      {showRate && (
           <Button
           variant="ghost"
           size="sm"
           className="h-7 px-2 text-xs rounded-lg hover:bg-background/50 hover:text-foreground transition-colors gap-1.5"
           onClick={onRate}
         >
           Rate
         </Button>
      )}
     
    </div>
  );
}
