export type Gender = "MALE" | "FEMALE" | "OTHER";

export interface UserSummary {
    id: number;
    email?: string;
    fullName: string;
    avatarUrl?: string;
    phoneNumber?: string;
    addressLine?: string | null;
    provinceCode?: number | null;
    provinceName?: string | null;
    wardCode?: number | null;
    wardName?: string | null;
    gender: Gender;
    dob?: string | null;
    createdAt?: string;
    passwordUpdatedAt?: string;
    dateOfBirth?: string | null;
    profileCompleted?: boolean;
    personalityId?: number | string;
    personalityCode?: string | null;
    roles?: string[];
    aiSelfAddress?: string | null;
    aiUserAddress?: string | null;
    preferredLanguage?: string | null;
}

export interface UpdateAiAddressRequest {
    aiSelfAddress: string;
    aiUserAddress: string;
}

export interface UpdateUserPersonalityRequest {
    personalityId: number;
}

export interface PersonalityResponse {
    id: number;
    code: string;
    name: string;
    description: string;
    isPremium: boolean;
}

export type RuleType = "WHITELIST" | "BLACKLIST";

export interface AppRuleResponse {
    id: number;
    keyword: string;
    ruleType: RuleType;
}

export interface CreateAppRuleRequest {
    keyword: string;
    ruleType: RuleType;
}

export interface ChangeLanguageRequest {
    language: string;
}