import hre from "hardhat";

// Summary: {
//   IdentityRegistry: '0x4bF31C2B0c05d44c22466720a56716CC29ac256d',
//   ReputationRegistry: '0x8FE8a44d7391e547A03ABdc98409854BB60A3640',
//   ValidationRegistry: '0x83E00B661fc78dF7d1a0942D51A7F730d81D2EDA',
//   AgentStaking: '0x14038685833b56b900a467AF28A9437e8abD574B'
// }

async function main() {
  const ethers = (hre as any).ethers;
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);
  console.log(
    "Account balance:",
    ethers.formatEther(await deployer.provider.getBalance(deployer.address)),
    "ETH\n"
  );

  // Deploy contracts
  const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = await IdentityRegistry.deploy();
  await identityRegistry.waitForDeployment();
  console.log("IdentityRegistry   →", await identityRegistry.getAddress());

  const ReputationRegistry = await ethers.getContractFactory(
    "ReputationRegistry"
  );
  // Constructor takes IdentityRegistry address
  const reputationRegistry = await ReputationRegistry.deploy(
    await identityRegistry.getAddress()
  );
  await reputationRegistry.waitForDeployment();
  console.log("ReputationRegistry →", await reputationRegistry.getAddress());

  const ValidationRegistry = await ethers.getContractFactory(
    "ValidationRegistry"
  );
  // Constructor takes ReputationRegistry address
  const validationRegistry = await ValidationRegistry.deploy(
    await reputationRegistry.getAddress()
  );
  await validationRegistry.waitForDeployment();
  console.log("ValidationRegistry →", await validationRegistry.getAddress());

  const AgentStaking = await ethers.getContractFactory("AgentStaking");
  // Constructor takes IdentityRegistry address and Treasury address
  // Treasury receives all slashed funds from bad agent reviews
  const treasuryAddress = process.env.TREASURY_ADDRESS || deployer.address;
  console.log("Using treasury address:", treasuryAddress);
  
  const agentStaking = await AgentStaking.deploy(
    await identityRegistry.getAddress(),
    treasuryAddress
  );
  await agentStaking.waitForDeployment();
  console.log("AgentStaking       →", await agentStaking.getAddress());
  console.log("  └── Treasury     →", treasuryAddress);

  // CRITICAL: Link AgentStaking to ReputationRegistry to enable slashing
  console.log("Linking AgentStaking to ReputationRegistry...");
  const tx = await agentStaking.setReputationContract(
    await reputationRegistry.getAddress()
  );
  await tx.wait();
  console.log("✅ AgentStaking linked to ReputationRegistry");

  console.log("\nAll necessary contracts deployed successfully!");
  console.log("Summary:", {
    IdentityRegistry: await identityRegistry.getAddress(),
    ReputationRegistry: await reputationRegistry.getAddress(),
    // Staking: await staking.getAddress(),
    ValidationRegistry: await validationRegistry.getAddress(),
    AgentStaking: await agentStaking.getAddress(),
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
