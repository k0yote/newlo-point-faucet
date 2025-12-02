import { ethers } from "hardhat";

async function main() {
  // Configuration
  const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ADDRESS;
  const CLAIM_AMOUNT = process.env.NEXT_PUBLIC_CLAIM_AMOUNT || "500";
  const TOKEN_DECIMALS = parseInt(process.env.NEXT_PUBLIC_TOKEN_DECIMALS || "18");
  const COOLDOWN_SECONDS = 24 * 60 * 60; // 24 hours

  if (!TOKEN_ADDRESS) {
    throw new Error("NEXT_PUBLIC_TOKEN_ADDRESS is not set in .env.local");
  }

  console.log("Deploying TokenFaucet...");
  console.log("Token Address:", TOKEN_ADDRESS);
  console.log("Claim Amount:", CLAIM_AMOUNT, "tokens");
  console.log("Cooldown:", COOLDOWN_SECONDS, "seconds (24 hours)");

  // Calculate claim amount with decimals
  const claimAmountWithDecimals = ethers.parseUnits(CLAIM_AMOUNT, TOKEN_DECIMALS);

  const TokenFaucet = await ethers.getContractFactory("TokenFaucet");
  const faucet = await TokenFaucet.deploy(
    TOKEN_ADDRESS,
    claimAmountWithDecimals,
    COOLDOWN_SECONDS
  );

  await faucet.waitForDeployment();

  const faucetAddress = await faucet.getAddress();
  console.log("\n========================================");
  console.log("TokenFaucet deployed to:", faucetAddress);
  console.log("========================================");
  console.log("\nNext steps:");
  console.log("1. Update .env.local with:");
  console.log(`   NEXT_PUBLIC_FAUCET_CONTRACT_ADDRESS=${faucetAddress}`);
  console.log("\n2. Transfer tokens to the faucet contract");
  console.log(`   Send tokens to: ${faucetAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
