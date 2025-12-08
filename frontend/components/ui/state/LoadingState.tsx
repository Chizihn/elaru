import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-6">
      <div className="relative">
        {/* Geometric loading animation */}
        <div
          className="w-20 h-20 border-3 border-primary animate-spin"
          style={{ animationDuration: "1s" }}
        >
          <div className="absolute inset-0 border-3 border-secondary rotate-45" />
        </div>
        <Loader2
          className="absolute inset-0 m-auto h-10 w-10 text-accent animate-spin"
          style={{ animationDuration: "1.5s" }}
        />
      </div>
      <p className="text-foreground font-bold uppercase tracking-wide text-sm animate-pulse">
        {message}
      </p>
    </div>
  );
}
