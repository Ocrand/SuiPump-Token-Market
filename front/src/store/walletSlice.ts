// store/walletSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface WalletState {
  connectedWallet: {
    avatar: string;
    name: string;
    bio: string;
  } | null;
}

const initialState: WalletState = {
  connectedWallet: null,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setConnectedWallet(state, action: PayloadAction<WalletState['connectedWallet']>) {
      state.connectedWallet = action.payload;
    },
    clearConnectedWallet(state) {
      state.connectedWallet = null;
    },
  },
});

export const { setConnectedWallet, clearConnectedWallet } = walletSlice.actions;
export default walletSlice.reducer;
