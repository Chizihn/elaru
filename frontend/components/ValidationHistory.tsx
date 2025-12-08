import { CheckCircle, XCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Validation {
  id: string;
  validator: string;
  isValid: boolean;
  comments: string;
  timestamp: string;
}

interface ValidationHistoryProps {
  validations: Validation[];
}

export function ValidationHistory({ validations }: ValidationHistoryProps) {
  if (!validations || validations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No validations yet.
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px] w-full rounded-md border p-4">
      <div className="space-y-4">
        {validations.map((val) => (
          <div key={val.id} className="flex items-start gap-4 border-b pb-4 last:border-0">
            <div className="mt-1">
              {val.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium leading-none">
                  Validator: {val.validator.slice(0, 6)}...{val.validator.slice(-4)}
                </p>
                <span className="text-xs text-muted-foreground">
                  {new Date(val.timestamp).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {val.comments || "No comments provided."}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
