'use client';

import { createContext, useMemo, useState } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SalmonWalletAdapter } from '@solana/wallet-adapter-salmon';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { SnapWalletAdapter } from '@drift-labs/snap-wallet-adapter';
require('@solana/wallet-adapter-react-ui/styles.css');

export function SolanaProvider({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Devnet;

  // You can also provide a custom RPC endpoint

  // 'https://testnet.dev2.eclipsenetwork.xyz' eclipse testnet
  const endpoint = useMemo(() => 'https://testnet.dev2.eclipsenetwork.xyz', []);

  const wallets = useMemo(
    () => [
      /**
       * Wallets that implement either of these standards will be available automatically.
       *
       *   - Solana Mobile Stack Mobile Wallet Adapter Protocol
       *     (https://github.com/solana-mobile/mobile-wallet-adapter)
       *   - Solana Wallet Standard
       *     (https://github.com/solana-labs/wallet-standard)
       *
       * If you wish to support a wallet that supports neither of those standards,
       * instantiate its legacy wallet adapter here. Common legacy adapters can be found
       * in the npm package `@solana/wallet-adapter-wallets`.
       */
      new PhantomWalletAdapter(),
      new SalmonWalletAdapter(),
      new SnapWalletAdapter(),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [network],
  );
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

// salute age memory control board dinner august physical vintage dune seat almost
