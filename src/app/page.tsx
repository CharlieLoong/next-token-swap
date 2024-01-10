'use client';

import React from 'react';
import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Trade from '@/components/trade';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { TOKEN_PROGRAM_ID } from '@/lib/ids';
import TokenBalance from '@/components/token-balance';

const WalletMultiButton = dynamic(
  async () =>
    (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  {
    loading: () => <Skeleton className="w-20 h-8" />,
  },
);

export default function Home() {
  const endpoint = useConnection().connection;
  const walletCtx = useWallet();
  console.log(walletCtx);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <ModeToggle />
      老张啊
      {/* <ConnectWallet /> */}
      <h1>EndPoint: {endpoint.rpcEndpoint}</h1>
      <WalletMultiButton />
      <Trade />
      {walletCtx.publicKey && <TokenBalance pubKey={walletCtx.publicKey} />}
    </main>
  );
}
