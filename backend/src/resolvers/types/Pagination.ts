import { ObjectType, Field, Int, ClassType } from "type-graphql";
import { Agent } from "../../entities/Agent";

@ObjectType()
export class PaginatedAgents {
  @Field(() => [Agent])
  items!: Agent[];

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  page!: number;

  @Field(() => Int)
  pageSize!: number;
}
