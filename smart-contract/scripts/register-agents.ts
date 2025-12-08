import hre from "hardhat";

async function main() {
  const ethers = (hre as any).ethers;
  const [deployer] = await ethers.getSigners();
  console.log("Registering agents with account:", deployer.address);

  // Updated address from recent deployment
  const IDENTITY_REGISTRY_ADDRESS = "0x4bF31C2B0c05d44c22466720a56716CC29ac256d";

  const identityRegistry = await ethers.getContractAt(
    "IdentityRegistry",
    IDENTITY_REGISTRY_ADDRESS
  );

  // 1. Register Weather Agent
  // console.log("Registering Weather Agent...");
  // const tx1 = await identityRegistry.registerAgent(
  //   deployer.address,
  //   "Weather Agent",
  //   "Provides accurate weather forecasts.",
  //   "Weather",
  //   "https://api.weather.com/v1"
  // );
  // await tx1.wait();
  // console.log("Weather Agent registered!");

  // 2. Register Sentiment Agent
  // console.log("Registering Sentiment Agent...");
  // const tx2 = await identityRegistry.registerAgent(
  //   deployer.address,
  //   "Sentiment Analysis Agent",
  //   "Analyzes text sentiment.",
  //   "Sentiment",
  //   "https://api.sentiment.com/v1"
  // );
  // await tx2.wait();
  // console.log("Sentiment Agent registered!");

  // 3. Register OpenAI Agent with a NEW wallet
  console.log("Creating new wallet for OpenAI Agent...");
  const openaiWallet = ethers.Wallet.createRandom().connect(ethers.provider);
  
  // Fund the new wallet
  console.log("Funding new wallet...");
  const txFund = await deployer.sendTransaction({
    to: openaiWallet.address,
    value: ethers.parseEther("0.1")
  });
  await txFund.wait();
  console.log("Funded OpenAI wallet:", openaiWallet.address);

  console.log("Registering OpenAI Agent...");
  const tx3 = await identityRegistry.connect(openaiWallet).registerAgent(
    openaiWallet.address,
    "OpenAI GPT-4o Agent",
    "General purpose AI assistant powered by GPT-4o.",
    "OpenAI GPT-4o",
    "/api/openai"
  );
  await tx3.wait();
  console.log("OpenAI Agent registered!");

  console.log("All agents registered successfully.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
