import api from "../../../lib/axios";
import type { ApiResponse } from "../../../types";
import type {
  ProfileCompletionResponse,
  SaveProfileRequest,
  UpdateAvatarRequest,
  UserSummary,
} from "../types/profile.types";

const PROFILE_ENDPOINT = "/users/me";

export const profileApi = {
  saveProfile: (data: SaveProfileRequest) =>
    api
      .put<ApiResponse<UserSummary>>(`${PROFILE_ENDPOINT}/basic-profile`, data)
      .then((r) => r.data.data),

  getProfileCompletion: () =>
    api
      .get<ApiResponse<ProfileCompletionResponse>>(
        `${PROFILE_ENDPOINT}/profile-completion`,
      )
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
};
