import { createPublicClient, createWalletClient, http, PublicClient, Chain, Account, Transport } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { NetworkId, getNetwork } from "./networks";

// Cache for public clients
const publicClientCache = new Map<NetworkId, PublicClient>();

// Get public client for a specific network
export function getPublicClient(networkId: NetworkId): PublicClient {
  const cached = publicClientCache.get(networkId);
  if (cached) {
    return cached;
  }

  const network = getNetwork(networkId);
  const client = createPublicClient({
    chain: network.chain,
    transport: http(network.rpcUrl),
  });

  publicClientCache.set(networkId, client);
  return client;
}

// Wallet client for write operations (server-side only)
export function getWalletClient(networkId: NetworkId) {
  const privateKey = process.env.OPERATOR_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("OPERATOR_PRIVATE_KEY is not set");
  }

  const network = getNetwork(networkId);
  const account = privateKeyToAccount(privateKey as `0x${string}`);

  return createWalletClient({
    account,
    chain: network.chain,
    transport: http(network.rpcUrl),
  }) as ReturnType<typeof createWalletClient<Transport, Chain, Account>>;
}

// Get operator account
export function getOperatorAccount() {
  const privateKey = process.env.OPERATOR_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("OPERATOR_PRIVATE_KEY is not set");
  }
  return privateKeyToAccount(privateKey as `0x${string}`);
}

// Get contract addresses for a network
export function getContractAddresses(networkId: NetworkId) {
  const network = getNetwork(networkId);
  return {
    faucetAddress: network.faucetAddress,
    tokenAddress: network.tokenAddress,
  };
}
