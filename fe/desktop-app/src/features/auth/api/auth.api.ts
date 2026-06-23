import api from "../../../lib/axios";
import type {
  LoginRequest,
  LoginResponse,
  RegisterInitRequest,
  RegisterResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  VerifyOtpRequest,
  VerifyRegisterResponse,
  CompleteRegisterRequest,
  ResetPasswordRequest,
  ExchangeResponse,
  RefreshResponse,
} from "../types/auth.types";

// Wrapper type khớp với ApiResponse<T> của BE
type ApiResponse<T> = {
  success: boolean;
  data: T;
  timestamp: string;
};

export const authApi = {
  login: (data: LoginRequest) =>
    api
      .post<ApiResponse<LoginResponse>>("/auth/login", data)
      .then((r) => r.data.data),

  logout: () => api.post("/auth/logout").then((r) => r.data),

  exchange: () =>
    api
      .post<ApiResponse<ExchangeResponse>>("/auth/exchange")
      .then((r) => r.data.data),

  refresh: () =>
    api
      .post<ApiResponse<RefreshResponse>>("/auth/refresh")
      .then((r) => r.data.data),

  registerInit: (data: RegisterInitRequest) =>
    api
      .post<ApiResponse<RegisterResponse>>("/auth/register/init", data)
      .then((r) => r.data.data),

  forgotPassword: (data: ForgotPasswordRequest) =>
    api
      .post<ApiResponse<ForgotPasswordResponse>>("/auth/password/forgot", data)
      .then((r) => r.data.data),

  verifyOtp: (data: VerifyOtpRequest) =>
    api
      .post<ApiResponse<VerifyRegisterResponse>>("/auth/verify", data)
      .then((r) => r.data.data),

  completeRegister: (data: CompleteRegisterRequest) =>
    api
      .post<ApiResponse<LoginResponse>>("/auth/register/complete", data)
      .then((r) => r.data.data),

  resetPassword: (data: ResetPasswordRequest) =>
    api.post<ApiResponse<null>>("/auth/password/reset", data).then((r) => r.data),
};
