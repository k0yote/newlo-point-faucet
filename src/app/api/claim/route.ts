import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import {
  getPublicClient,
  getWalletClient,
  getOperatorAccount,
  getContractAddresses,
} from "@/lib/client";
import { isValidNetworkId, DEFAULT_NETWORK, NetworkId } from "@/lib/networks";
import { FAUCET_ABI } from "@/lib/abi";

export async function POST(request: NextRequest) {
  try {
    const { address, network: networkParam } = await request.json();

    // Validate network
    const networkId: NetworkId = isValidNetworkId(networkParam)
      ? networkParam
      : DEFAULT_NETWORK;

    // Validate address
    if (!address || !isAddress(address)) {
      return NextResponse.json(
        { success: false, error: "Invalid wallet address" },
        { status: 400 }
      );
    }

    // Get contract addresses for the network
    const { faucetAddress } = getContractAddresses(networkId);

    // Check if contract is configured
    if (!faucetAddress) {
      return NextResponse.json(
        { success: false, error: "Faucet contract not configured for this network" },
        { status: 500 }
      );
    }

    const publicClient = getPublicClient(networkId);

    // Check cooldown
    const canClaim = await publicClient.readContract({
      address: faucetAddress,
      abi: FAUCET_ABI,
      functionName: "canClaim",
      args: [address as `0x${string}`],
    });

    if (!canClaim) {
      const remainingCooldown = await publicClient.readContract({
        address: faucetAddress,
        abi: FAUCET_ABI,
        functionName: "getRemainingCooldown",
        args: [address as `0x${string}`],
      });

      const remainingMinutes = Math.ceil(Number(remainingCooldown) / 60);

      return NextResponse.json(
        {
          success: false,
          error: `Cooldown active. Please wait ${remainingMinutes} minutes.`,
          remainingSeconds: Number(remainingCooldown),
        },
        { status: 429 }
      );
    }

    // Execute claimFor transaction
    const walletClient = getWalletClient(networkId);
    const account = getOperatorAccount();

    const hash = await walletClient.writeContract({
      address: faucetAddress,
      abi: FAUCET_ABI,
      functionName: "claimFor",
      args: [address as `0x${string}`],
      account,
    });

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      confirmations: 1,
    });

    if (receipt.status === "reverted") {
      return NextResponse.json(
        { success: false, error: "Transaction reverted" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transactionHash: hash,
      message: "Tokens claimed successfully!",
    });
  } catch (error) {
    console.error("Claim error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Check for specific errors
    if (errorMessage.includes("CooldownNotExpired")) {
      return NextResponse.json(
        { success: false, error: "Cooldown period not expired" },
        { status: 429 }
      );
    }

    if (errorMessage.includes("InsufficientBalance")) {
      return NextResponse.json(
        { success: false, error: "Faucet has insufficient balance" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
