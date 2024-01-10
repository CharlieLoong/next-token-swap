import { create } from 'zustand';
import { SnapWalletAdapter } from '@drift-labs/snap-wallet-adapter';

interface WalletStore {
  connected: boolean;
  setConnected: (connected: boolean) => void;
  adapter: SnapWalletAdapter;
}

export const useWallet = create<WalletStore>((set) => ({
  connected: false,
  setConnected: (connected: boolean) => set({ connected }),
  adapter: new SnapWalletAdapter(),
}));
