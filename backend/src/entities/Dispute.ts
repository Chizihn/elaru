import { ObjectType, Field, ID, registerEnumType, GraphQLISODateTime } from "type-graphql";
import { DisputeState } from "@prisma/client";

registerEnumType(DisputeState, {
  name: "DisputeState",
  description: "The current state of a dispute",
});

@ObjectType()
export class Dispute {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  taskId!: string;

  @Field(() => String)
  raisedBy!: string;

  @Field(() => String)
  reason!: string;

  @Field(() => DisputeState)
  status!: DisputeState; // PENDING, VOTING, RESOLVED_REFUND, RESOLVED_RELEASE

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  resolvedAt?: Date | null;

  @Field(() => [DisputeVote], { nullable: true })
  votes?: DisputeVote[];
}

@ObjectType()
export class DisputeVote {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  disputeId!: string;

  @Field(() => String)
  validator!: string;

  @Field(() => Boolean)
  approveRefund!: boolean;

  @Field(() => String, { nullable: true })
  comment?: string | null;

  @Field(() => GraphQLISODateTime)
  votedAt!: Date;
}
