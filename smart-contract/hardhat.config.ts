import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-abi-exporter";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    fuji: {
      url:
        process.env.FUJI_RPC_URL ||
        "https://api.avax-test.network/ext/bc/C/rpc",
      accounts: process.env.FUJI_PRIVATE_KEY
        ? [process.env.FUJI_PRIVATE_KEY]
        : [],
      chainId: 43113,
      gasPrice: "auto",
    },
  },
  etherscan: {
    apiKey: {
      avalancheFujiTestnet: process.env.SNOWTRACE_API_KEY || "",
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  abiExporter: {
    path: "./abi",
    runOnCompile: true,
    clear: true,
    flat: true,
    only: [":BugReport$"],
    spacing: 2,
  },
};

// Alternative fix for etherscan - install @nomiclabs/hardhat-etherscan if you need etherscan verification
// Then you can use:
// etherscan: {
//     apiKey: {
//         avalancheFujiTestnet: process.env.AVALANCHE_API_KEY || '',
//     },
// },

export default config;
