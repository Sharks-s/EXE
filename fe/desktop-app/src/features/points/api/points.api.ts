import api from "@/lib/axios";
import type { ApiResponse } from "@/types";
import type { PointTransactionPage, PointWallet } from "../types/points.types";

export const pointsApi = {
  getWallet: async (): Promise<PointWallet> => {
    const res = await api.get<ApiResponse<PointWallet>>("/points/wallet");
    return res.data.data;
  },

  getTransactions: async (params?: {
    page?: number;
    size?: number;
  }): Promise<PointTransactionPage> => {
    const res = await api.get<ApiResponse<PointTransactionPage>>(
      "/points/transactions",
      { params },
    );
    return res.data.data;
  },
};
