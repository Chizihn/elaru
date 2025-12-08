import { InputType, Field, Int } from "type-graphql";

@InputType()
export class GetAgentsInput {
  @Field({ nullable: true })
  serviceType?: string;

  @Field({ nullable: true, defaultValue: "reputationScore" })
  orderBy?: string;

  @Field({ nullable: true, defaultValue: "desc" })
  orderDirection?: "asc" | "desc";

  @Field(() => Int, { nullable: true, defaultValue: 1 })
  page?: number;

  @Field(() => Int, { nullable: true, defaultValue: 10 })
  pageSize?: number;
}
