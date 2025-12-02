import { NextRequest, NextResponse } from "next/server";
import { isAddress, formatUnits } from "viem";
import { publicClient, FAUCET_CONTRACT_ADDRESS, TOKEN_ADDRESS } from "@/lib/client";
import { FAUCET_ABI, ERC20_ABI } from "@/lib/abi";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!FAUCET_CONTRACT_ADDRESS || !TOKEN_ADDRESS) {
      return NextResponse.json(
        { error: "Contracts not configured" },
        { status: 500 }
      );
    }

    // Get faucet info
    const [faucetBalance, claimAmount, cooldownTime, tokenDecimals, tokenSymbol] =
      await Promise.all([
        publicClient.readContract({
          address: FAUCET_CONTRACT_ADDRESS,
          abi: FAUCET_ABI,
          functionName: "getBalance",
        }),
        publicClient.readContract({
          address: FAUCET_CONTRACT_ADDRESS,
          abi: FAUCET_ABI,
          functionName: "claimAmount",
        }),
        publicClient.readContract({
          address: FAUCET_CONTRACT_ADDRESS,
          abi: FAUCET_ABI,
          functionName: "cooldownTime",
        }),
        publicClient.readContract({
          address: TOKEN_ADDRESS,
          abi: ERC20_ABI,
          functionName: "decimals",
        }),
        publicClient.readContract({
          address: TOKEN_ADDRESS,
          abi: ERC20_ABI,
          functionName: "symbol",
        }),
      ]);

    const response: {
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
          address: FAUCET_CONTRACT_ADDRESS,
          abi: FAUCET_ABI,
          functionName: "canClaim",
          args: [address as `0x${string}`],
        }),
        publicClient.readContract({
          address: FAUCET_CONTRACT_ADDRESS,
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
