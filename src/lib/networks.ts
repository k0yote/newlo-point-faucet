import { Chain } from "viem";
import { soneiumMinato, kaiaKairos } from "./chain";

export type NetworkId = "minato" | "kairos";

export interface NetworkConfig {
  id: NetworkId;
  name: string;
  chain: Chain;
  rpcUrl: string;
  faucetAddress: `0x${string}` | undefined;
  tokenAddress: `0x${string}` | undefined;
  explorerUrl: string;
}

// Network configurations
export const networks: Record<NetworkId, NetworkConfig> = {
  minato: {
    id: "minato",
    name: "Soneium Minato",
    chain: soneiumMinato,
    rpcUrl: process.env.NEXT_PUBLIC_MINATO_RPC_URL || "https://rpc.minato.soneium.org",
    faucetAddress: process.env.NEXT_PUBLIC_MINATO_FAUCET_ADDRESS as `0x${string}` | undefined,
    tokenAddress: process.env.NEXT_PUBLIC_MINATO_TOKEN_ADDRESS as `0x${string}` | undefined,
    explorerUrl: "https://explorer-testnet.soneium.org",
  },
  kairos: {
    id: "kairos",
    name: "Kaia Kairos",
    chain: kaiaKairos,
    rpcUrl: process.env.NEXT_PUBLIC_KAIROS_RPC_URL || "https://public-en-kairos.node.kaia.io",
    faucetAddress: process.env.NEXT_PUBLIC_KAIROS_FAUCET_ADDRESS as `0x${string}` | undefined,
    tokenAddress: process.env.NEXT_PUBLIC_KAIROS_TOKEN_ADDRESS as `0x${string}` | undefined,
    explorerUrl: "https://kairos.kaiascan.io",
  },
};

// Get network by ID
export function getNetwork(networkId: NetworkId): NetworkConfig {
  const network = networks[networkId];
  if (!network) {
    throw new Error(`Unknown network: ${networkId}`);
  }
  return network;
}

// Check if network ID is valid
export function isValidNetworkId(id: string): id is NetworkId {
  return id === "minato" || id === "kairos";
}

// Get all available networks (those with configured contracts)
export function getAvailableNetworks(): NetworkConfig[] {
  return Object.values(networks).filter(
    (n) => n.faucetAddress && n.tokenAddress
  );
}

// Default network
export const DEFAULT_NETWORK: NetworkId = "minato";
