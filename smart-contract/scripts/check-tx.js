const { ethers } = require('hardhat');

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.AVALANCHE_FUJI_RPC);
  const txHash = '0xe3f53fe23f756944806ae22452c5905678748339e91442f224f743c632faa3147';
  
  // Get transaction receipt
  const receipt = await provider.getTransactionReceipt(txHash);
  console.log('Transaction Receipt:', {
    status: receipt.status === 1 ? 'Success' : 'Failed',
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString(),
    logs: receipt.logs
  });
  
  // Get the contract
  const BugReport = await ethers.getContractFactory('BugReport');
  const contract = BugReport.attach(process.env.CONTRACT_ADDRESS);
  
  // Check bug counter
  const bugCount = await contract.bugCounter();
  console.log('Total bugs reported:', bugCount.toString());
  
  // Try to get the first bug
  if (bugCount > 0) {
    try {
      const bug = await contract.bugs(1);
      console.log('Bug #1:', {
        id: bug.id.toString(),
        projectName: bug.projectName,
        description: bug.description,
        reporter: bug.reporter,
        status: bug.status.toString(),
        projectOwner: bug.projectOwner
      });
    } catch (error) {
      console.error('Error fetching bug #1:', error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
