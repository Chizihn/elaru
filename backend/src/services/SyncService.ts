import { ethers } from "ethers";
import prisma from "../configs/database";
import * as dotenv from "dotenv";
import logger from "../utils/logger";

dotenv.config();

// ABI fragments for the events/functions we need
const IDENTITY_ABI = [
  "function totalAgents() view returns (uint256)",
  "function getAgentMetadata(uint256) view returns (tuple(string name, string description, string serviceType, string endpoint, address operatorAddress, uint256 registeredAt, bool isActive))",
  "event AgentRegistered(uint256 indexed tokenId, address indexed agentWallet, string serviceType)",
];

const REPUTATION_ABI = [
  "function getAgentStats(uint256) view returns (tuple(uint256 totalFeedbacks, uint256 totalScore, uint256 averageScore))",
];

const VALIDATION_ABI = [
  "function getValidations(bytes32) view returns (tuple(address validator, address agent, bytes32 taskHash, bool isValid, string comments, uint256 timestamp)[])",
];

export class SyncService {
  private provider: ethers.JsonRpcProvider;
  private identityContract: ethers.Contract;
  private reputationContract: ethers.Contract;
  private validationContract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(
      process.env.AVALANCHE_RPC_URL ||
        "https://api.avax-test.network/ext/bc/C/rpc"
    );

    // Use addresses from env or defaults
    const identityAddress =
      process.env.IDENTITY_REGISTRY_ADDRESS ||
      "0x0000000000000000000000000000000000000000";
    const reputationAddress =
      process.env.REPUTATION_REGISTRY_ADDRESS ||
      "0x0000000000000000000000000000000000000000";
    const validationAddress =
      process.env.VALIDATION_REGISTRY_ADDRESS ||
      "0x0000000000000000000000000000000000000000";

    this.identityContract = new ethers.Contract(
      identityAddress,
      IDENTITY_ABI,
      this.provider
    );
    this.reputationContract = new ethers.Contract(
      reputationAddress,
      REPUTATION_ABI,
      this.provider
    );
    this.validationContract = new ethers.Contract(
      validationAddress,
      VALIDATION_ABI,
      this.provider
    );
  }

  async syncAgents() {
    logger.info("Starting Agent Sync...");
    try {
      if (this.identityContract.target === ethers.ZeroAddress) {
        logger.warn("Contracts not deployed/configured. Skipping sync.");
        return;
      }

      // logger.info(`Syncing with IdentityRegistry at: ${this.identityContract.target}`);
      const totalAgents = await this.identityContract.totalAgents();
      logger.info(`Found ${totalAgents} agents on-chain.`);

      for (let i = 1; i <= Number(totalAgents); i++) {
        const metadata = await this.identityContract.getAgentMetadata(i);
        const stats = await this.reputationContract.getAgentStats(i);

        // Upsert Agent - handle potential walletAddress conflicts
        // Check if an agent with this wallet already exists (might have different tokenId)
        const existingByWallet = await prisma.agent.findUnique({
          where: { walletAddress: metadata.operatorAddress }
        });

        const existingByTokenId = await prisma.agent.findUnique({
          where: { tokenId: i }
        });

        let agent;
        
        if (existingByWallet && existingByWallet.tokenId !== i) {
          // Wallet exists with different tokenId
          // If the new tokenId also exists on a different record, delete that orphaned record first
          if (existingByTokenId && existingByTokenId.id !== existingByWallet.id) {
            await prisma.agent.delete({ where: { id: existingByTokenId.id } });
            logger.debug(`Deleted orphaned agent record with tokenId ${i}`);
          }
          // Now update the wallet's record with the new tokenId
          agent = await prisma.agent.update({
            where: { walletAddress: metadata.operatorAddress },
            data: {
              tokenId: i,
              name: metadata.name,
              serviceType: metadata.serviceType,
              endpoint: metadata.endpoint,
              description: metadata.description,
              active: metadata.isActive,
              reputationScore: Number(stats.averageScore),
              pricePerRequest: "100000",
            },
          });
        } else if (existingByTokenId) {
          // TokenId exists - update it
          agent = await prisma.agent.update({
            where: { tokenId: i },
            data: {
              walletAddress: metadata.operatorAddress,
              name: metadata.name,
              serviceType: metadata.serviceType,
              endpoint: metadata.endpoint,
              description: metadata.description,
              active: metadata.isActive,
              reputationScore: Number(stats.averageScore),
              pricePerRequest: "100000",
            },
          });
        } else {
          // Neither exists - create new
          agent = await prisma.agent.create({
            data: {
              tokenId: i,
              walletAddress: metadata.operatorAddress,
              name: metadata.name,
              serviceType: metadata.serviceType,
              endpoint: metadata.endpoint,
              description: metadata.description,
              active: metadata.isActive,
              reputationScore: Number(stats.averageScore),
              pricePerRequest: "100000",
            },
          });
        }

        // Sync Validations (Mocking taskHash iteration or fetching recent ones)
        // In reality, we'd query events. For now, we'll skip complex event fetching
        // and just log that we would sync validations here.
        // To make this "hackathon worthy", let's assume we fetch validations for a known taskHash or just link existing ones.

        logger.debug(`Synced Agent ${i}`);
      }
    } catch (error) {
      logger.error("Error syncing agents:", error);
    }
  }
}
