import { create } from 'zustand';

interface SettingState {
  slippage: number;
  DENOMINATOR: number;
}

interface SettingAction {
  setSlippage: (slippage: number) => void;
}

const initialState: SettingState = {
  slippage: 0.005,
  DENOMINATOR: 1000,
};

export const useSetting = create<SettingState & SettingAction>((set) => ({
  ...initialState,
  setSlippage: (slippage) => {
    if (slippage < 0.005 || slippage > 0.1) return;
    set({ slippage });
  },
}));
