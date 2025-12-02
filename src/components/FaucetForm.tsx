"use client";

import { useState, useEffect, useCallback } from "react";
import { isAddress } from "viem";

interface FaucetStatus {
  faucetBalance: string;
  claimAmount: string;
  cooldownTimeSeconds: number;
  tokenSymbol: string;
  tokenDecimals: number;
  userStatus?: {
    canClaim: boolean;
    remainingCooldownSeconds: number;
  };
}

interface ClaimResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  message?: string;
  remainingSeconds?: number;
}

export function FaucetForm() {
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ClaimResult | null>(null);
  const [status, setStatus] = useState<FaucetStatus | null>(null);
  const [countdown, setCountdown] = useState<number>(0);

  const fetchStatus = useCallback(async (walletAddress?: string) => {
    try {
      const url = walletAddress
        ? `/api/status?address=${walletAddress}`
        : "/api/status";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        if (data.userStatus?.remainingCooldownSeconds > 0) {
          setCountdown(data.userStatus.remainingCooldownSeconds);
        }
      }
    } catch (error) {
      console.error("Failed to fetch status:", error);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (address && isAddress(address)) {
      fetchStatus(address);
    }
  }, [address, fetchStatus]);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchStatus(address);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, address, fetchStatus]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);

    if (!isAddress(address)) {
      setResult({ success: false, error: "Invalid wallet address" });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      const data: ClaimResult = await response.json();
      setResult(data);

      if (data.success) {
        fetchStatus(address);
      } else if (data.remainingSeconds) {
        setCountdown(data.remainingSeconds);
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Request failed",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const explorerUrl = result?.transactionHash
    ? `https://explorer-testnet.soneium.org/tx/${result.transactionHash}`
    : null;

  const isValidAddress = address && isAddress(address);
  const canSubmit =
    isValidAddress && !isLoading && (status?.userStatus?.canClaim ?? true);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Faucet Info */}
      {status && (
        <div className="mb-6 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
          <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
            Faucet Info
          </h3>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-zinc-500">Amount per claim:</span>{" "}
              <span className="font-medium">
                {status.claimAmount} {status.tokenSymbol}
              </span>
            </p>
            <p>
              <span className="text-zinc-500">Cooldown:</span>{" "}
              <span className="font-medium">
                {formatTime(status.cooldownTimeSeconds)}
              </span>
            </p>
            <p>
              <span className="text-zinc-500">Faucet balance:</span>{" "}
              <span className="font-medium">
                {Number(status.faucetBalance).toLocaleString()} {status.tokenSymbol}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Claim Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
          >
            Wallet Address
          </label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            disabled={isLoading}
          />
          {address && !isValidAddress && (
            <p className="mt-1 text-sm text-red-500">Invalid address format</p>
          )}
        </div>

        {/* Cooldown Display */}
        {countdown > 0 && isValidAddress && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              Cooldown active: <span className="font-mono font-medium">{formatTime(countdown)}</span>
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
            canSubmit
              ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              : "bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </span>
          ) : countdown > 0 && isValidAddress ? (
            `Wait ${formatTime(countdown)}`
          ) : (
            `Request ${status?.claimAmount ?? "500"} ${status?.tokenSymbol ?? "Tokens"}`
          )}
        </button>
      </form>

      {/* Result Display */}
      {result && (
        <div
          className={`mt-4 p-4 rounded-lg ${
            result.success
              ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
          }`}
        >
          {result.success ? (
            <div className="space-y-2">
              <p className="text-green-700 dark:text-green-400 font-medium">
                {result.message}
              </p>
              {explorerUrl && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                >
                  View transaction
                </a>
              )}
            </div>
          ) : (
            <p className="text-red-700 dark:text-red-400">{result.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
