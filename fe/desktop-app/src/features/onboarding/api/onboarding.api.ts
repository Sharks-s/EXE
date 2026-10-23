import api from "@/lib/axios";
import type { ApiResponse } from "@/types";
import type { User } from "@/features/auth";
import type { CompleteOnboardingRequest } from "../types/onboarding.types";

export const onboardingApi = {
  complete: (data: CompleteOnboardingRequest) =>
    api
      .put<ApiResponse<User>>("/users/me/onboarding", data)
      .then((response) => response.data.data),
};
