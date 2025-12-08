import { ObjectType, Field, ID, GraphQLISODateTime } from "type-graphql";

@ObjectType()
export class User {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  walletAddress!: string;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;
}

@ObjectType()
export class AuthResponse {
  @Field(() => String)
  token!: string;

  @Field(() => User)
  user!: User;
}
