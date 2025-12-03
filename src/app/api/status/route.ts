import { NextRequest, NextResponse } from "next/server";
import { isAddress, formatUnits } from "viem";
import { getPublicClient, getContractAddresses } from "@/lib/client";
import { isValidNetworkId, DEFAULT_NETWORK, NetworkId, getNetwork } from "@/lib/networks";
import { FAUCET_ABI, ERC20_ABI } from "@/lib/abi";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    const networkParam = searchParams.get("network");

    // Validate network
    const networkId: NetworkId = isValidNetworkId(networkParam || "")
      ? (networkParam as NetworkId)
      : DEFAULT_NETWORK;

    const { faucetAddress, tokenAddress } = getContractAddresses(networkId);
    const network = getNetwork(networkId);

    if (!faucetAddress || !tokenAddress) {
      return NextResponse.json(
        { error: "Contracts not configured for this network" },
        { status: 500 }
      );
    }

    const publicClient = getPublicClient(networkId);

    // Get faucet info
    const [faucetBalance, claimAmount, cooldownTime, tokenDecimals, tokenSymbol] =
      await Promise.all([
        publicClient.readContract({
          address: faucetAddress,
          abi: FAUCET_ABI,
          functionName: "getBalance",
        }),
        publicClient.readContract({
          address: faucetAddress,
          abi: FAUCET_ABI,
          functionName: "claimAmount",
        }),
        publicClient.readContract({
          address: faucetAddress,
          abi: FAUCET_ABI,
          functionName: "cooldownTime",
        }),
        publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: "decimals",
        }),
        publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: "symbol",
        }),
      ]);

    const response: {
      network: {
        id: string;
        name: string;
        explorerUrl: string;
      };
      faucetBalance: string;
      claimAmount: string;
      cooldownTimeSeconds: number;
      tokenSymbol: string;
      tokenDecimals: number;
      userStatus?: {
        canClaim: boolean;
        remainingCooldownSeconds: number;
      };
    } = {
      network: {
        id: networkId,
        name: network.name,
        explorerUrl: network.explorerUrl,
      },
      faucetBalance: formatUnits(faucetBalance, tokenDecimals),
      claimAmount: formatUnits(claimAmount, tokenDecimals),
      cooldownTimeSeconds: Number(cooldownTime),
      tokenSymbol: tokenSymbol,
      tokenDecimals: tokenDecimals,
    };

    // Get user-specific info if address provided
    if (address && isAddress(address)) {
      const [canClaim, remainingCooldown] = await Promise.all([
        publicClient.readContract({
          address: faucetAddress,
          abi: FAUCET_ABI,
          functionName: "canClaim",
          args: [address as `0x${string}`],
        }),
        publicClient.readContract({
          address: faucetAddress,
          abi: FAUCET_ABI,
          functionName: "getRemainingCooldown",
          args: [address as `0x${string}`],
        }),
      ]);

      response.userStatus = {
        canClaim,
        remainingCooldownSeconds: Number(remainingCooldown),
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Status error:", error);
    return NextResponse.json(
      { error: "Failed to get faucet status" },
      { status: 500 }
    );
  }
}
