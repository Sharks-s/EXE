import api from "@/lib/axios";
import type { ApiResponse } from "@/types";
import type { Achievement } from "../types/achievement.types";

export const achievementsApi = {
  getMine: async (): Promise<Achievement[]> => {
    const res = await api.get<ApiResponse<Achievement[]>>("/achievements/me");
    return res.data.data;
  },

  getMyProgress: async (): Promise<Achievement[]> => {
    const res = await api.get<ApiResponse<Achievement[]>>(
      "/achievements/me/progress",
    );
    return res.data.data;
  },
};
