import hre from "hardhat";

async function main() {
  const ethers = (hre as any).ethers;
  const [deployer] = await ethers.getSigners();
  console.log("Checking agent for account:", deployer.address);

  const IDENTITY_REGISTRY_ADDRESS = "0x4bF31C2B0c05d44c22466720a56716CC29ac256d";
  const identityRegistry = await ethers.getContractAt("IdentityRegistry", IDENTITY_REGISTRY_ADDRESS);

  const agentId = await identityRegistry.getAgentId(deployer.address);
  console.log("Agent ID:", agentId.toString());

  if (agentId > 0) {
    const metadata = await identityRegistry.getAgentMetadata(agentId);
    console.log("Agent Metadata:", metadata);
  } else {
    console.log("No agent registered.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
