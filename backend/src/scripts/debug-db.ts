import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const agents = await prisma.agent.findMany();
  console.log(`TOTAL AGENTS: ${agents.length}`);
  agents.forEach((a) => {
    console.log(`[${a.name}] Active: ${a.active} | Score: ${a.reputationScore}`);
  });
}

main();
