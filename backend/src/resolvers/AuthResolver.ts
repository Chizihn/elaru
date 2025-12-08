import { Resolver, Query, Mutation, Arg, Ctx } from "type-graphql";
import { GraphQLError } from "graphql";
import { User, AuthResponse } from "../entities/User";
import { generateToken } from "../utils/jwt";
import prisma from "../configs/database";
import { ethers } from "ethers";
import logger from "../utils/logger";

interface Context {
  user?: {
    userId: string;
    walletAddress: string;
  };
}

@Resolver(User)
export class AuthResolver {
  @Query(() => String)
  async requestNonce(@Arg("walletAddress", () => String) walletAddress: string): Promise<string> {
    try {
      const nonce = Math.random().toString(36).substring(2, 15);
      
      // @ts-ignore
      await prisma.user.upsert({
        where: { walletAddress: walletAddress.toLowerCase() },
        update: { nonce },
        create: {
          walletAddress: walletAddress.toLowerCase(),
          nonce
        }
      });

      logger.info(`Nonce requested for wallet: ${walletAddress}`);
      return nonce;
    } catch (error) {
      logger.error(`AuthResolver.requestNonce failed for ${walletAddress}:`, error);
      throw new GraphQLError('Failed to generate nonce', {
        extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: error }
      });
    }
  }

  @Mutation(() => AuthResponse)
  async authenticate(
    @Arg("walletAddress", () => String) walletAddress: string,
    @Arg("signature", () => String) signature: string
  ): Promise<AuthResponse> {
    logger.debug(`AuthResolver: Attempting authentication for ${walletAddress}`);
    try {
      // @ts-ignore
      const user = await prisma.user.findUnique({
        where: { walletAddress: walletAddress.toLowerCase() }
      });

      if (!user) {
        logger.warn(`Authentication failed: User not found for ${walletAddress}`);
        throw new GraphQLError("User not found. Please request a nonce first.", {
          extensions: { code: 'USER_NOT_FOUND' }
        });
      }

      // Verify signature
      const message = `Sign this message to authenticate with Elaru\n\nNonce: ${user.nonce}`;
      const recoveredAddress = ethers.verifyMessage(message, signature);

      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        logger.warn(`Authentication failed: Invalid signature for ${walletAddress}`);
        throw new GraphQLError("Invalid signature", {
          extensions: { code: 'INVALID_SIGNATURE' }
        });
      }

      // Generate new nonce for next login
      const newNonce = Math.random().toString(36).substring(2, 15);
      // @ts-ignore
      await prisma.user.update({
        where: { id: user.id },
        data: { nonce: newNonce }
      });

      // Generate JWT
      const token = generateToken({
        userId: user.id,
        walletAddress: user.walletAddress
      });

      logger.info(`User authenticated successfully: ${walletAddress}`);

      return {
        token,
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          createdAt: user.createdAt
        }
      };
    } catch (error) {
      if (error instanceof GraphQLError) throw error;
      logger.error(`AuthResolver.authenticate failed for ${walletAddress}:`, error);
      throw new GraphQLError('Authentication failed', {
        extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: error }
      });
    }
  }

  @Query(() => User, { nullable: true })
  async me(@Ctx() context: Context): Promise<User | null> {
    try {
      if (!context.user) {
        return null;
      }

      // @ts-ignore
      const user = await prisma.user.findUnique({
        where: { id: context.user.userId }
      });

      return user;
    } catch (error) {
      logger.error('AuthResolver.me failed:', error);
      throw new GraphQLError('Failed to fetch user', {
        extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: error }
      });
    }
  }
}
