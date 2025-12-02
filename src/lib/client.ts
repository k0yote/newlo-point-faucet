import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { soneiumMinato } from "./chain";

// Public client for read operations
export const publicClient = createPublicClient({
  chain: soneiumMinato,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL),
});

// Wallet client for write operations (server-side only)
export function getWalletClient() {
  const privateKey = process.env.OPERATOR_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("OPERATOR_PRIVATE_KEY is not set");
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);

  return createWalletClient({
    account,
    chain: soneiumMinato,
    transport: http(process.env.NEXT_PUBLIC_RPC_URL),
  });
}

// Get operator account
export function getOperatorAccount() {
  const privateKey = process.env.OPERATOR_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("OPERATOR_PRIVATE_KEY is not set");
  }
  return privateKeyToAccount(privateKey as `0x${string}`);
}

// Contract addresses
export const FAUCET_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_FAUCET_CONTRACT_ADDRESS as `0x${string}`;
export const TOKEN_ADDRESS =
  process.env.NEXT_PUBLIC_TOKEN_ADDRESS as `0x${string}`;
