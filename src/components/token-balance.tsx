'use client';

import React, { useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import tokenlist from '@/constants/token-list.json';
import { useConnection } from '@solana/wallet-adapter-react';
import { TOKEN_PROGRAM_ID } from '@/lib/ids';
import { TokenSwap } from '@/models';

type TokenBalanceProps = {
  pubKey: PublicKey;
};

export default function TokenBalance({ pubKey }: TokenBalanceProps) {
  const [tokens, setTokens] = useState(
    tokenlist['testnet'].map((item) => ({ ...item, balance: 0 })),
  );
  const connection = useConnection().connection;

  useEffect(() => {
    async function getTokenAccounts() {
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
                console.log(token.tokenName, token.balance);
              }
              resolve(token);
            }),
        ),
      );
      setTokens(tokensWithBalance);
    }
    getTokenAccounts();
  }, [connection, pubKey]);

  return (
    <div className="flex flex-col">
      {tokens.map((token, index) => (
        <div key={token.tokenName}>
          {token.tokenName}: {token.balance}
        </div>
      ))}
    </div>
  );
}
