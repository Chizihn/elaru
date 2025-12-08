import { ObjectType, Field, ID } from "type-graphql";

@ObjectType()
export class Validation {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  agentId!: string;

  @Field(() => String)
  validator!: string;

  @Field(() => Boolean)
  isValid!: boolean;

  @Field(() => String, { nullable: true })
  comments?: string;

  @Field(() => String)
  timestamp!: string;
}
