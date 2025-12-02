# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ERC20 Token Faucet for Soneium Minato testnet. A Next.js frontend with a Solidity smart contract that allows operators to distribute tokens to users with cooldown enforcement.

## Commands

### Development
```bash
npm run dev          # Start Next.js dev server (localhost:3000)
npm run build        # Build for production
npm run lint         # Run ESLint
```

### Smart Contract
```bash
npm run compile      # Compile Solidity contracts with Hardhat
npm run deploy:minato # Deploy TokenFaucet to Soneium Minato testnet
```

## Architecture

### Smart Contract (`contracts/TokenFaucet.sol`)
- Ownable + ReentrancyGuard pattern from OpenZeppelin
- Operators (not users) call `claimFor(recipient)` to distribute tokens
- Per-address cooldown tracking via `lastClaimTime` mapping
- Configurable `claimAmount` and `cooldownTime` (default: 500 tokens, 24 hours)

### Next.js App (App Router)
- **API Routes:**
  - `POST /api/claim` - Executes `claimFor` on-chain via operator wallet
  - `GET /api/status?address=` - Returns faucet balance, claim amount, user cooldown status
- **Frontend:** Single-page form (`src/components/FaucetForm.tsx`) with real-time cooldown countdown

### Viem Client Setup (`src/lib/`)
- `chain.ts` - Soneium Minato chain definition (chainId: 1946)
- `client.ts` - Public client for reads, wallet client factory for operator writes
- `abi.ts` - TokenFaucet and ERC20 ABI definitions

## Environment Variables

Required in `.env.local`:
```
OPERATOR_PRIVATE_KEY=        # Operator wallet private key (server-side only)
NEXT_PUBLIC_RPC_URL=         # Soneium Minato RPC URL
NEXT_PUBLIC_TOKEN_ADDRESS=   # ERC20 token contract address
NEXT_PUBLIC_FAUCET_CONTRACT_ADDRESS=  # Deployed TokenFaucet address
```

## Deployment Flow

1. Set `NEXT_PUBLIC_TOKEN_ADDRESS` and `OPERATOR_PRIVATE_KEY` in `.env.local`
2. Run `npm run deploy:minato`
3. Copy deployed faucet address to `NEXT_PUBLIC_FAUCET_CONTRACT_ADDRESS`
4. Transfer ERC20 tokens to the faucet contract
