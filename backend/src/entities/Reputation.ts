import { ObjectType, Field, ID, Int } from "type-graphql";

@ObjectType()
export class Feedback {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  reviewer!: string;

  @Field(() => Int)
  score!: number;

  @Field(() => String)
  comment!: string;

  @Field(() => String)
  paymentProof!: string;

  @Field(() => String)
  timestamp!: string;
}

@ObjectType()
export class Reputation {
  @Field(() => ID)
  agentId!: string;

  @Field(() => Int)
  totalScore!: number;

  @Field(() => Int)
  reviewCount!: number;

  @Field(() => [Feedback])
  feedbacks!: Feedback[];
}
