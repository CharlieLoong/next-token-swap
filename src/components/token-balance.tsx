'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import tokenlist from '@/constants/token-list.json';
import { useConnection } from '@solana/wallet-adapter-react';
import { TOKEN_PROGRAM_ID } from '@/lib/ids';
import { TokenSwap } from '@/models';
import { Button } from './ui/button';
import { RefreshCcw } from 'lucide-react';

type TokenBalanceProps = {
  accountName?: string;
  pubKey: PublicKey;
};

export default function TokenBalance({
  pubKey,
  accountName = 'Wallet',
}: TokenBalanceProps) {
  const [tokens, setTokens] = useState(
    tokenlist['testnet'].map((item) => ({ ...item, balance: 0 })),
  );
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
    <div className="flex flex-col border p-2 rounded-sm shadow w-1/2">
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
