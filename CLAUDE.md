# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-network ERC20 Token Faucet supporting Soneium Minato and Kaia Kairos testnets. A Next.js frontend with a Solidity smart contract that allows operators to distribute tokens to users with cooldown enforcement.

## Commands

### Development
```bash
npm run dev          # Start Next.js dev server (localhost:3000)
npm run build        # Build for production
npm run lint         # Run ESLint
```

### Smart Contract
```bash
npm run compile       # Compile Solidity contracts with Hardhat
npm run deploy:minato # Deploy TokenFaucet to Soneium Minato testnet
npm run deploy:kairos # Deploy TokenFaucet to Kaia Kairos testnet
```

## Architecture

### Smart Contract (`contracts/TokenFaucet.sol`)
- Ownable + ReentrancyGuard pattern from OpenZeppelin
- Operators (not users) call `claimFor(recipient)` to distribute tokens
- Per-address cooldown tracking via `lastClaimTime` mapping
- Configurable `claimAmount` and `cooldownTime` (default: 500 tokens, 24 hours)

### Next.js App (App Router)
- **API Routes:**
  - `POST /api/claim` - Executes `claimFor` on-chain via operator wallet (accepts `network` param)
  - `GET /api/status?address=&network=` - Returns faucet balance, claim amount, user cooldown status
  - `GET /api/networks` - Returns list of available networks
- **Frontend:** Single-page form (`src/components/FaucetForm.tsx`) with network selector and real-time cooldown countdown

### Viem Client Setup (`src/lib/`)
- `chain.ts` - Chain definitions for Soneium Minato (chainId: 1946) and Kaia Kairos (chainId: 1001)
- `networks.ts` - Network configuration registry with contract addresses per network
- `client.ts` - Dynamic public/wallet client factory based on selected network
- `abi.ts` - TokenFaucet and ERC20 ABI definitions

## Supported Networks

| Network | Chain ID | Explorer |
|---------|----------|----------|
| Soneium Minato | 1946 | https://explorer-testnet.soneium.org |
| Kaia Kairos | 1001 | https://kairos.kaiascan.io |

## Environment Variables

Required in `.env.local`:
```
# Operator (shared across networks)
OPERATOR_PRIVATE_KEY=        # Operator wallet private key (server-side only)

# Soneium Minato
NEXT_PUBLIC_MINATO_RPC_URL=         # (optional, defaults to https://rpc.minato.soneium.org)
NEXT_PUBLIC_MINATO_FAUCET_ADDRESS=  # Deployed TokenFaucet address on Minato
NEXT_PUBLIC_MINATO_TOKEN_ADDRESS=   # ERC20 token contract address on Minato

# Kaia Kairos
NEXT_PUBLIC_KAIROS_RPC_URL=         # (optional, defaults to https://public-en-kairos.node.kaia.io)
NEXT_PUBLIC_KAIROS_FAUCET_ADDRESS=  # Deployed TokenFaucet address on Kairos
NEXT_PUBLIC_KAIROS_TOKEN_ADDRESS=   # ERC20 token contract address on Kairos
```

## Deployment Flow

### For Soneium Minato:
1. Set `NEXT_PUBLIC_MINATO_TOKEN_ADDRESS` and `OPERATOR_PRIVATE_KEY` in `.env.local`
2. Run `npm run deploy:minato`
3. Copy deployed faucet address to `NEXT_PUBLIC_MINATO_FAUCET_ADDRESS`
4. Transfer ERC20 tokens to the faucet contract

### For Kaia Kairos:
1. Set `NEXT_PUBLIC_KAIROS_TOKEN_ADDRESS` and `OPERATOR_PRIVATE_KEY` in `.env.local`
2. Run `npm run deploy:kairos`
3. Copy deployed faucet address to `NEXT_PUBLIC_KAIROS_FAUCET_ADDRESS`
4. Transfer ERC20 tokens to the faucet contract

## Adding New Networks

1. Add chain definition in `src/lib/chain.ts`
2. Add network config in `src/lib/networks.ts` (update `NetworkId` type)
3. Add network to `hardhat.config.ts`
4. Add deploy script in `package.json`
5. Set environment variables for the new network
