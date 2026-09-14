import { create } from "zustand";
import { pointsApi } from "../api/points.api";
import type { PointWallet } from "../types/points.types";

type PointsState = {
  wallet: PointWallet | null;
  isWalletLoading: boolean;
  setWallet: (wallet: PointWallet | null) => void;
  setCurrentPoints: (currentPoints: number) => void;
  fetchWallet: () => Promise<void>;
};

export const usePointsStore = create<PointsState>((set) => ({
  wallet: null,
  isWalletLoading: false,

  setWallet: (wallet) => set({ wallet }),

  setCurrentPoints: (currentPoints) =>
    set((state) => ({
      wallet: state.wallet
        ? { ...state.wallet, currentPoints }
        : {
            currentPoints,
            totalEarnedPoints: currentPoints,
            totalSpentPoints: 0,
          },
    })),

  fetchWallet: async () => {
    set({ isWalletLoading: true });
    try {
      const wallet = await pointsApi.getWallet();
      set({ wallet });
    } finally {
      set({ isWalletLoading: false });
    }
  },
}));
