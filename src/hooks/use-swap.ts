import { PublicKey } from '@solana/web3.js';
import { useMint } from './use-mint';
import { toast } from 'sonner';
import { useCallback, useEffect, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { createTokenSwap, fetchTokenSwap } from '@/lib/token-swap/lib';
import { CurveType, TokenSwap } from '@/lib/token-swap';

/**
 * Get info of current tokenSwap instance
 */
export const useSwap = () => {
  const [tokenSwap, setTokenSwap] = useState<TokenSwap | null>(null);

  const { mintA, mintB, swapAccountPubKey, setMintPool, setSwapAccountPubKey } =
    useMint();
  const connection = useConnection().connection;

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
    toast('NEW SWAP CREATED', {
      description: `<>pool token: ${tokenSwap.poolToken.toString()}</>`,
    });
  }

  useEffect(() => {
    getOrCreatePool();
  }, []);

  return tokenSwap;
};
