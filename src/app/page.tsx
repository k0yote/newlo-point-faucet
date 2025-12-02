import { FaucetForm } from "@/components/FaucetForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-black">
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            Token Faucet
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
            Get test tokens for Soneium Minato testnet. Enter your wallet address below.
          </p>
        </div>

        <FaucetForm />

        <footer className="mt-16 text-center text-sm text-zinc-500 dark:text-zinc-500">
          <p>Network: Soneium Minato Testnet (Chain ID: 1946)</p>
        </footer>
      </main>
    </div>
  );
}
