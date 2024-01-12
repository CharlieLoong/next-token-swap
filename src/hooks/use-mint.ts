import { Keypair, PublicKey } from '@solana/web3.js';
import SuperJSON from 'superjson';
import { create } from 'zustand';
import { PersistStorage, persist } from 'zustand/middleware';

interface MintState {
  mintA: string; // Base58 public key
  mintB: string;
  mintPool: string;
  swapAccountPubKey: string;
}

interface Action {
  setMintPool: (key: PublicKey) => void;
  setSwapAccountPubKey: (key: PublicKey) => void;
}

const storage: PersistStorage<MintState> = {
  getItem: (name) => {
    const str = localStorage.getItem(name);
    if (!str) return null;
    return SuperJSON.parse(str);
  },
  setItem: (name, value) => {
    localStorage.setItem(name, SuperJSON.stringify(value));
  },
  removeItem: (name) => localStorage.removeItem(name),
};

export const useMint = create<MintState & Action>()(
  persist(
    (set) => ({
      mintA: 'WgJ4QZ2SqDomPToBn2cjqjnXETNiHxPdh35mBsCdqgk',
      mintB: 'VfkeR5txoVnrHrrEKVmnfZ2jcJY5vWqEeqmV4cfJtQH',
      mintPool: '',
      swapAccountPubKey: '',
      setMintPool: (key: PublicKey) => set({ mintPool: key.toBase58() }),
      setSwapAccountPubKey: (key: PublicKey) =>
        set({ swapAccountPubKey: key.toBase58() }),
    }),
    {
      name: 'mint-storage',
      storage,
    },
  ),
);
