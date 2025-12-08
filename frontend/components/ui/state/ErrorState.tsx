import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  error?: Error | { message: string } | unknown;
}

export function ErrorState({
  title = "Something went wrong",
  message = "An error occurred while fetching data.",
  onRetry,
  error,
}: ErrorStateProps) {
  // Extract useful message from error object if present
  const errorMessage =
    error && typeof error === "object" && "message" in error
      ? String(error.message)
      : message;

  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-8 text-center">
      <div className="p-6 bg-destructive border-3 border-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)]">
        <AlertTriangle className="h-16 w-16 text-background" />
      </div>
      <div className="space-y-3 max-w-md">
        <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">
          {title}
        </h3>
        <p className="text-base font-medium text-muted-foreground">
          {errorMessage}
        </p>
      </div>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="destructive"
          size="lg"
          className="gap-2"
        >
          <RefreshCcw className="h-5 w-5" />
          Try Again
        </Button>
      )}
    </div>
  );
}
