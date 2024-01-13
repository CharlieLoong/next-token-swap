'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import tokenlist from '@/constants/token-list.json';
import { useConnection } from '@solana/wallet-adapter-react';

import { Button } from './ui/button';
import { RefreshCcw } from 'lucide-react';
import { useMint } from '@/hooks/use-mint';

type TokenBalanceProps = {
  accountName?: string;
  pubKey: PublicKey;
};

export default function TokenBalance({
  pubKey,
  accountName = 'Wallet',
}: TokenBalanceProps) {
  const [mintA, mintB, mintPool] = useMint((s) => [
    s.mintA,
    s.mintB,
    s.mintPool,
  ]);
  // const [tokens, setTokens] = useState(
  //   tokenlist['testnet'].map((item) => ({ ...item, balance: 0 })),
  // );

  const [tokens, setTokens] = useState([
    {
      tokenName: 'A',
      mintAddress: mintA,
      balance: 'loading',
    },
    {
      tokenName: 'B',
      mintAddress: mintB,
      balance: 'loading',
    },
    {
      tokenName: 'LP',
      mintAddress: mintPool,
      balance: 'loading',
    },
  ]);

  const connection = useConnection().connection;

  const getTokenBalances = useCallback(async () => {
    const tokensWithBalance = await Promise.all(
      tokens.map(
        (token) =>
          new Promise(async (resolve) => {
            const response = await connection.getParsedTokenAccountsByOwner(
              pubKey,
              {
                // this filter get All tokens
                // programId: TOKEN_PROGRAM_ID,
                mint: new PublicKey(token.mintAddress),
              },
            );
            if (response.value.length) {
              token.balance =
                response.value[0].account.data.parsed.info.tokenAmount.uiAmount;
            }
            resolve(token);
          }),
      ),
    );
    setTokens(tokensWithBalance as typeof tokens);
  }, [connection, pubKey, tokens]);
  useEffect(() => {
    getTokenBalances();
  }, [getTokenBalances]);

  return (
    <div className="flex flex-col border p-2 rounded-sm shadow w-64 gap-1">
      <h2>Token Balances of {accountName}</h2>
      {tokens.map((token, index) => (
        <div key={token.tokenName}>
          {token.tokenName}: {token.balance}
        </div>
      ))}
      <Button onClick={getTokenBalances}>
        <RefreshCcw />
      </Button>
    </div>
  );
}
