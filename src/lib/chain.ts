import { defineChain } from "viem";

// Soneium Minato Testnet
export const soneiumMinato = defineChain({
  id: 1946,
  name: "Soneium Minato",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.minato.soneium.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Soneium Minato Explorer",
      url: "https://explorer-testnet.soneium.org",
    },
  },
  testnet: true,
});

// Kaia Kairos Testnet
export const kaiaKairos = defineChain({
  id: 1001,
  name: "Kaia Kairos",
  nativeCurrency: {
    name: "KAIA",
    symbol: "KAIA",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://public-en-kairos.node.kaia.io"],
    },
  },
  blockExplorers: {
    default: {
      name: "Kaia Kairos Explorer",
      url: "https://kairos.kaiascan.io",
    },
  },
  testnet: true,
});
