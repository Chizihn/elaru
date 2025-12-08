import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const agents = [
    {
      walletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", // Demo Wallet
      serviceType: "Weather Data Oracle",
      endpoint: "http://localhost:4000/api/weather",
      description: "Real-time weather data for any location. Verified by TrustFlow validators.",
      pricePerRequest: "10000", // 0.01 USDC
      reputationScore: 95.5,
      active: true,
      tokenId: 1
    },
    {
      walletAddress: "0x1234567890123456789012345678901234567890",
      serviceType: "Crypto Price Feed",
      endpoint: "http://localhost:4000/api/prices",
      description: "Institutional-grade crypto price feeds with sub-second latency.",
      pricePerRequest: "20000", // 0.02 USDC
      reputationScore: 98.0,
      active: true,
      tokenId: 2
    },
    {
      walletAddress: "0x0987654321098765432109876543210987654321",
      serviceType: "Market Sentiment AI",
      endpoint: "http://localhost:4000/api/sentiment",
      description: "AI-driven sentiment analysis from social media and news sources.",
      pricePerRequest: "50000", // 0.05 USDC
      reputationScore: 88.5,
      active: true,
      tokenId: 3
    }
  ];

  for (const agent of agents) {
    const exists = await prisma.agent.findUnique({
      where: { walletAddress: agent.walletAddress } // Assuming walletAddress is unique or using ID if needed
    });

    if (!exists) {
      await prisma.agent.create({
        data: agent
      });
      console.log(`Created agent: ${agent.serviceType}`);
    } else {
      console.log(`Agent already exists: ${agent.serviceType}`);
    }
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
      // @ts-ignore
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
