import hre, { upgrades } from "hardhat";
import { exit } from "process";

/**
 * The main function for upgrading the contract.
 */
async function main(): Promise<void> {
  const ethers = (hre as any).ethers;

  // !! IMPORTANT !!
  // Replace with the address of your deployed proxy contract.
  const proxyAddress = "0x..."; // e.g., "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"

  if (!proxyAddress || proxyAddress === "0x...") {
    console.error(
      "Proxy address is not set. Please replace '0x...' in scripts/upgrade.ts with your deployed proxy address."
    );
    exit(1);
  }

  // Replace 'ElaruV2' with the name of your new implementation contract.
  const NewContractFactory = await ethers.getContractFactory("ElaruV2");

  console.log(`Upgrading the contract at proxy: ${proxyAddress}`);

  try {
    const upgradedProxy = await upgrades.upgradeProxy(
      proxyAddress,
      NewContractFactory
    );
    await upgradedProxy.waitForDeployment();

    const proxyAddr = await upgradedProxy.getAddress();
    const implementationAddr = await upgrades.erc1967.getImplementationAddress(
      proxyAddr
    );

    console.log("Contract upgraded successfully!");
    console.log(`Proxy is at: ${proxyAddr}`);
    console.log(`New implementation is at: ${implementationAddr}`);
  } catch (error) {
    console.error("Upgrade failed:", error);
    exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    exit(1);
  });
