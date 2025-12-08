export interface Agent {
  id: string;
  name?: string;
  serviceType: string;
  reputationScore: number;
  pricePerRequest: string;
  description: string;
  endpoint: string;
  walletAddress: string;
  stakedAmount?: string;
  slashedAmount?: string;
  stakingTxHash?: string;
  completedTasksCount?: number;
  validationCount?: number;
  successRate?: number;
}
