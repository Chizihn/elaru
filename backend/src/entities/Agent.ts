import { ObjectType, Field, ID, Float, GraphQLISODateTime, Int } from "type-graphql";

@ObjectType()
export class Agent {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  walletAddress!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String)
  serviceType!: string;

  @Field(() => String)
  endpoint!: string;

  @Field(() => Float)
  reputationScore!: number;

  @Field(() => String)
  description!: string;

  @Field(() => String)
  pricePerRequest!: string; // In wei/USDC base units

  @Field(() => Boolean)
  active!: boolean;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;

  @Field(() => String)
  stakedAmount!: string;

  @Field(() => String)
  slashedAmount!: string;

  @Field(() => String, { nullable: true })
  stakingTxHash?: string | null;

  @Field(() => String)
  minimumStake!: string;

  @Field(() => Int, { nullable: true })
  completedTasksCount?: number;

  @Field(() => Int, { nullable: true })
  validationCount?: number;

  @Field(() => Float, { nullable: true })
  successRate?: number;
}
