'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import Trade from '@/components/trade';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

import {
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  createAccount,
  getAccount,
  mintTo,
  getMint,
  approve,
} from '@solana/spl-token';

import { PublicKey, Keypair } from '@solana/web3.js';

import TokenBalance from '@/components/token-balance';
import {
  POOL_TOKEN_AMOUNT,
  createTokenSwap,
  depositAllTokenTypes,
  fetchTokenSwap,
  owner,
  payer,
  swap,
  withdrawAllTokenTypes,
} from '@/lib/token-swap/lib';
import { CurveType, TokenSwap } from '@/lib/token-swap';
import Faucet from '@/components/faucet';
import { useMint } from '@/hooks/use-mint';
import { Input } from '@/components/ui/input';

const WalletMultiButton = dynamic(
  async () =>
    (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  {
    loading: () => <Skeleton className="w-20 h-8" />,
  },
);
export default function Home() {
  const [tokenSwap, setTokenSwap] = useState<TokenSwap | null>(null);
  const [swapType, setSwapType] = useState<'0' | '1'>('0');
  const {
    mintA,
    mintB,
    mintPool,
    setMintPool,
    swapAccountPubKey,
    setSwapAccountPubKey,
  } = useMint();
  const connection = useConnection().connection;
  const walletCtx = useWallet();

  async function getOrCreatePool() {
    if (swapAccountPubKey) {
      toast.info('SWAP ALREADY CREATED, Loading from contract');
      const fetchedTokenSwap = await fetchTokenSwap(
        connection,
        swapAccountPubKey,
      );
      setTokenSwap(fetchedTokenSwap);
      toast.success('Fetch success');
      return;
    }
    const tokenSwap = await createTokenSwap(
      connection,
      CurveType.ConstantProduct,
    );
    setTokenSwap(tokenSwap);
    setMintPool(tokenSwap.poolToken);
    setSwapAccountPubKey(tokenSwap.tokenSwap);
    toast('SWAP CREATED', {
      description: <>pool token: {tokenSwap.poolToken.toString()}</>,
    });
  }
  async function deposit() {
    // if (tokenSwap && walletCtx.publicKey) {
    //   const userAccountA = await getOrCreateAssociatedTokenAccount(
    //     connection,
    //     payer,
    //     new PublicKey(mintA),
    //     walletCtx.publicKey,
    //   );
    //   const userAccountB = await getOrCreateAssociatedTokenAccount(
    //     connection,
    //     payer,
    //     new PublicKey(mintB),
    //     walletCtx.publicKey,
    //   );

    //   // const poolAccount = await getOrCreateAssociatedTokenAccount(
    //   //   connection,
    //   //   payer,
    //   //   new PublicKey(mintPool),
    //   //   owner.publicKey,
    //   // );

    //   const newAccountPool = await createAccount(
    //     connection,
    //     payer,
    //     new PublicKey(mintPool),
    //     owner.publicKey,
    //     Keypair.generate(),
    //   );

    //   try {
    //     await tokenSwap.depositAllTokenTypes(
    //       userAccountA.address,
    //       userAccountB.address,
    //       newAccountPool,
    //       TOKEN_PROGRAM_ID,
    //       TOKEN_PROGRAM_ID,
    //       Keypair.generate(),
    //       10000000n,
    //       1000000n,
    //       1000000n,
    //       { skipPreflight: true },
    //     );
    //   } catch (e) {
    //     console.log(e);
    //     toast.error('Deposit failed');
    //     return;
    //   }
    // }
    if (!tokenSwap || !walletCtx.publicKey) return toast.error('!!!');
    toast('depositing');
    await depositAllTokenTypes(connection, tokenSwap, walletCtx);
    toast.success('deposit success');
  }

  async function withdraw() {
    if (!tokenSwap) return;
    toast('withdrawing');
    await withdrawAllTokenTypes(connection, tokenSwap, walletCtx);
    toast.success('withdraw success');
  }

  async function swapTokens() {
    if (!tokenSwap) return;
    toast('swapping');
    await swap(connection, tokenSwap, walletCtx, Number(swapType));
    toast.success('swap success');
  }

  // console.log(walletCtx);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <ModeToggle />
      <Faucet />
      老张啊
      {/* <ConnectWallet /> */}
      <h1>EndPoint: {connection.rpcEndpoint}</h1>
      <WalletMultiButton />
      {/* <Trade /> */}
      <span>Token A: {mintA}</span>
      <span>Token B: {mintB}</span>
      <span>Token LP: {mintPool}</span>
      <span>Swap Account address: {swapAccountPubKey}</span>
      {walletCtx.publicKey && <TokenBalance pubKey={walletCtx.publicKey} />}
      {tokenSwap?.authority && (
        <TokenBalance accountName="Authority" pubKey={tokenSwap?.authority} />
      )}
      {owner.publicKey && (
        <TokenBalance accountName="Owner" pubKey={owner.publicKey} />
      )}
      <Button onClick={getOrCreatePool} disabled={tokenSwap != null}>
        CREATE POOL
      </Button>
      <Button onClick={deposit}>DEPOSIT</Button>
      <Button onClick={withdraw}>Withdraw</Button>
      <div>
        <Select
          value={swapType}
          onValueChange={(e) => {
            setSwapType(e as any);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="InputToken" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">mintA</SelectItem>
            <SelectItem value="1">mintB</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={swapTokens}>Swap</Button>
      </div>
    </main>
  );
}
