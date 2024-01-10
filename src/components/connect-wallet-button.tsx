'use client';

import { Button } from './ui/button';
import Image from 'next/image';
import React, { useContext, useState } from 'react';
import { Skeleton } from './ui/skeleton';
import { useWallet } from '@/hooks/use-wallet';
import { cn } from '@/lib/utils';

export default function ConnectWallet() {
  const [pending, setPending] = useState(false);
  const [connected, setConnected, driftSnapWalletAdapter] = useWallet(
    (state) => [state.connected, state.setConnected, state.adapter],
  );
  const connect = async () => {
    setPending(true);
    await driftSnapWalletAdapter.connect();
    setPending(false);
  };
  const disconnect = async () => {
    setPending(true);
    await driftSnapWalletAdapter.disconnect();
    setPending(false);
  };
  console.log(driftSnapWalletAdapter);

  if (!driftSnapWalletAdapter) {
    return <Skeleton className="w-20 h-8" />;
  }
  return (
    <>
      <span>PubKey: {driftSnapWalletAdapter.publicKey?.toJSON()}</span>
      <Button
        className={cn({ pending: 'opacity-25' })}
        disabled={pending}
        variant={'outline'}
        onClick={driftSnapWalletAdapter.connected ? disconnect : connect}
      >
        <Image
          width={24}
          height={24}
          src={driftSnapWalletAdapter.icon}
          alt="logo"
        />
        {'  '}
        {driftSnapWalletAdapter.connected ? 'disconnect' : 'connect'}
      </Button>
    </>
  );
}
