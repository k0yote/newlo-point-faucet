import { NextResponse } from "next/server";
import { networks, NetworkId } from "@/lib/networks";

export async function GET() {
  // Return all networks with their configuration status
  const networkList = Object.entries(networks).map(([id, config]) => ({
    id: id as NetworkId,
    name: config.name,
    explorerUrl: config.explorerUrl,
    isConfigured: Boolean(config.faucetAddress && config.tokenAddress),
  }));

  return NextResponse.json({ networks: networkList });
}
