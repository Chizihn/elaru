import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';

interface StakeBadgeProps {
  stakedAmount: string;
  slashedAmount?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function StakeBadge({ stakedAmount, slashedAmount = '0', size = 'md' }: StakeBadgeProps) {
  // Convert from wei to AVAX
  const stakeInAvax = parseFloat(stakedAmount) / 1e18;
  const slashedInAvax = parseFloat(slashedAmount) / 1e18;
  const effectiveStake = stakeInAvax - slashedInAvax;

  if (effectiveStake <= 0) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };

  const getStakeColor = (stake: number) => {
    if (stake >= 10) return 'bg-green-500/20 text-green-400 border-green-500/50';
    if (stake >= 5) return 'bg-primary/20 text-primary border-primary/50';
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
  };

  return (
    <Badge 
      variant="outline" 
      className={`${sizeClasses[size]} ${getStakeColor(effectiveStake)} flex items-center gap-1.5 font-semibold border`}
    >
      <Shield className="h-3 w-3" />
      <span>{effectiveStake.toFixed(1)} AVAX Staked</span>
    </Badge>
  );
}
