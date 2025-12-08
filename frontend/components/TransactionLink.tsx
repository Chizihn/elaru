import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TransactionLinkProps {
  txHash: string;
  label?: string;
  variant?: 'default' | 'outline' | 'ghost';
}

export function TransactionLink({ txHash, label = 'View on Explorer', variant = 'outline' }: TransactionLinkProps) {
  const explorerUrl = `https://testnet.snowtrace.io/tx/${txHash}`;

  return (
    <Button
      variant={variant}
      size="sm"
      asChild
    >
      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2"
      >
        <ExternalLink className="h-4 w-4" />
        {label}
      </a>
    </Button>
  );
}
