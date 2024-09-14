import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ModalState {
  activeModal: string | null;
}

interface WalletState {
  connectedWallet: {
    account: string;
    avatar: string;
    name: string;
    bio: string;
  } | null;
}

const initialState: ModalState & WalletState = {
  activeModal: null,
  connectedWallet: null,
};

const loadState = () => {
  try {
    const serializedState = localStorage.getItem('walletState');
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    return undefined;
  }
};

const saveState = (state: WalletState) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem('walletState', serializedState);
  } catch {
    // Ignore write errors
  }
};

const persistedState = loadState();

const modalSlice = createSlice({
  name: 'modal',
  initialState: {
    activeModal: null,
  } as ModalState, // 确保初始状态符合 ModalState 类型
  reducers: {
    openModal: (state, action: PayloadAction<string>) => {
      state.activeModal = action.payload;
    },
    closeModal: (state) => {
      state.activeModal = null;
    },
  },
});

const walletSlice = createSlice({
  name: 'wallet',
  initialState: persistedState || initialState,
  reducers: {
    setConnectedWallet: (state, action: PayloadAction<{ account: string, avatar: string; name: string; bio: string; }>) => {
      state.connectedWallet = action.payload;
      saveState(state);
    },
    clearConnectedWallet: (state) => {
      state.connectedWallet = null;
      saveState(state);
    },
  },
});

export const { openModal, closeModal } = modalSlice.actions;
export const { setConnectedWallet, clearConnectedWallet } = walletSlice.actions;

const store = configureStore({
  reducer: {
    modal: modalSlice.reducer,
    wallet: walletSlice.reducer,
  },
});

export default store;

export type RootState = ReturnType<typeof store.getState>;