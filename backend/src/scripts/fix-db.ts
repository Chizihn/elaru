import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🛠️ Fixing Database...");
  
  // 1. Activate all agents
  const update1 = await prisma.agent.updateMany({
    data: { active: true }
  });
  console.log(`✅ Activated ${update1.count} agents.`);

  // 2. Set min reputation to 50
  const update2 = await prisma.agent.updateMany({
    where: { reputationScore: { lt: 50 } },
    data: { reputationScore: 50 }
  });
  console.log(`✅ Boosted reputation for ${update2.count} agents to 50.`);

  // 3. List Agents
  const agents = await prisma.agent.findMany();
  agents.forEach(a => {
    console.log(`[${a.name}] Service: ${a.serviceType} | Score: ${a.reputationScore}`);
  });
}

main();
