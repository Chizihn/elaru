import { ObjectType, Field, Int, ID, registerEnumType, GraphQLISODateTime } from "type-graphql";
import { Agent } from "./Agent";
import { TaskStatus, PaymentStatus, DisputeStatus } from "@prisma/client";

registerEnumType(TaskStatus, {
  name: "TaskStatus",
  description: "The current status of a task",
});

registerEnumType(PaymentStatus, {
  name: "PaymentStatus",
  description: "The current status of a payment",
});

registerEnumType(DisputeStatus, {
  name: "DisputeStatus",
  description: "The current status of a dispute",
});

@ObjectType()
export class Task {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  userId!: string;

  @Field(() => String)
  description!: string;

  @Field(() => TaskStatus)
  status!: TaskStatus;

  @Field(() => String, { nullable: true })
  selectedAgentId?: string | null;

  @Field(() => Agent, { nullable: true })
  agent?: Agent | null;

  @Field(() => String, { nullable: true })
  paymentTxHash?: string | null;

  @Field(() => PaymentStatus, { nullable: true })
  paymentStatus?: PaymentStatus | null;

  @Field(() => String, { nullable: true })
  result?: string | null;

  @Field(() => Int, { nullable: true })
  reviewScore?: number | null;

  @Field(() => String, { nullable: true })
  reviewComment?: string | null;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  completedAt?: Date | null;

  // Dispute fields
  @Field(() => DisputeStatus, { nullable: true })
  disputeStatus?: DisputeStatus | null;

  @Field(() => String, { nullable: true })
  disputeReason?: string | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  disputeRaisedAt?: Date | null;

  @Field(() => String, { nullable: true })
  escrowTxHash?: string | null;
}
