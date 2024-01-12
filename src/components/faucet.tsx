import React from 'react';
import { Button } from './ui/button';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useMint } from '@/hooks/use-mint';
import { myKeyPair } from '@/lib/token-swap/lib';
import { mintTo, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import { toast } from 'sonner';
import { PublicKey } from '@solana/web3.js';

export default function Faucet() {
  const connection = useConnection().connection;
  const wallet = useWallet();
  const { mintA, mintB } = useMint();
  const payer = myKeyPair;
  const owner = myKeyPair;
  async function getTokens(mint: PublicKey | string) {
    if (typeof mint === 'string') mint = new PublicKey(mint);

    if (!wallet.publicKey) {
      toast.error('Please connect wallet first');
      return;
    }
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      wallet.publicKey,
    );
    await mintTo(connection, payer, mint, tokenAccount.address, owner, 1000000);
    toast.success('爆了100金币');
  }
  return (
    <div>
      <h1>爆金币咯</h1>
      <Button onClick={() => getTokens(mintA)}>mint A</Button>
      <Button onClick={() => getTokens(mintB)}>mint B</Button>
    </div>
  );
}
