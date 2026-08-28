import api from "../../../lib/axios";
import type { ApiResponse } from "../../../types";
import type {
  DailyUsageResponse,
  ProfileCompletionResponse,
  SaveProfileRequest,
  UpdateAvatarRequest,
  UserSummary,
} from "../types/profile.types";

const PROFILE_ENDPOINT = "/users/me";
type ChangePasswordRequest = {
  oldPassword: string;
  newPassword: string;
};

export const profileApi = {
  getMyProfile: () =>
    api
      .get<ApiResponse<UserSummary>>(PROFILE_ENDPOINT)
      .then((r) => r.data.data),

  saveProfile: (data: SaveProfileRequest) =>
    api
      .put<ApiResponse<UserSummary>>(`${PROFILE_ENDPOINT}/basic-profile`, data)
      .then((r) => r.data.data),

  getDailyUsage: () =>
    api
      .get<ApiResponse<DailyUsageResponse>>(`${PROFILE_ENDPOINT}/daily-usage`)
      .then((r) => r.data.data),

  updateAvatar: (data: UpdateAvatarRequest) => {
    const formData = new FormData();
    formData.append("avatar", data.avatar);

    return api
      .put<ApiResponse<UserSummary>>(
        `${PROFILE_ENDPOINT}/avatar`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      )
      .then((r) => r.data.data);
  },

  changePassword: (data: ChangePasswordRequest) =>
    api
      .put<ApiResponse<null>>(`${PROFILE_ENDPOINT}/password`, data)
      .then((r) => r.data),

  deleteMyAccount: () =>
    api.delete<ApiResponse<null>>(PROFILE_ENDPOINT).then((r) => r.data),
};
