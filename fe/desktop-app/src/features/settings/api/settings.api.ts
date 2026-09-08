import api from "@/lib/axios";
import type { ApiResponse } from "@/types";
import type {
    UpdateAiAddressRequest,
    UserSummary,
    UpdateUserPersonalityRequest,
    PersonalityResponse,
    AppRuleResponse,
    CreateAppRuleRequest,
    ChangeLanguageRequest
} from "../types/settings.types";

export const settingsApi = {
    // PUT /users/me/ai-address
    updateAiAddress: (data: UpdateAiAddressRequest) =>
        api
            .put<ApiResponse<UserSummary>>("/users/me/ai-address", data)
            .then((r) => r.data.data),

    // PUT /users/me/personality
    updateUserPersonality: (data: UpdateUserPersonalityRequest) =>
        api
            .put<ApiResponse<UserSummary>>("/users/me/personality", data)
            .then((r) => r.data.data),

    // GET /personalities (path cần xác nhận từ Controller)
    getPersonalities: () =>
        api
            .get<ApiResponse<PersonalityResponse[]>>("/personalities")
            .then((r) => r.data.data),

    // GET /app-rules/me
    getMyAppRules: () =>
        api
            .get<ApiResponse<AppRuleResponse[]>>("/app-rules/me")
            .then((r) => r.data.data),

    // POST /app-rules/me
    createAppRule: (data: CreateAppRuleRequest) =>
        api
            .post<ApiResponse<AppRuleResponse>>("/app-rules/me", data)
            .then((r) => r.data.data),

    // DELETE /app-rules/me/{ruleId}
    deleteAppRule: (ruleId: number) =>
        api.delete<ApiResponse<null>>(`/app-rules/me/${ruleId}`).then((r) => r.data),

    // PUT /users/me/language
    changeLanguage: (data: ChangeLanguageRequest) =>
        api
            .put<ApiResponse<UserSummary>>("/users/me/language", data)
            .then((r) => r.data.data),
};
