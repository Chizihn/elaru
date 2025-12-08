import { LucideIcon, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon = SearchX,
  title = "No items found",
  description = "We couldn't find what you were looking for.",
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-8 text-center border-3 border-dashed border-border bg-card">
      <div className="p-6 bg-muted border-3 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
        <Icon className="h-12 w-12 text-foreground" />
      </div>
      <div className="space-y-3 max-w-sm">
        <h3 className="text-xl font-black uppercase tracking-tight text-foreground">
          {title}
        </h3>
        <p className="text-base font-medium text-muted-foreground">
          {description}
        </p>
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="default" size="lg">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
