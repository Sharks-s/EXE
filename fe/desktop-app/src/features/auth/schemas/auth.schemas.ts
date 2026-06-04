import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().min(1).max(150).email(),
  password: z.string().min(1).max(32),
});

export const RegisterInitSchema = z.object({
  email: z.string().min(1).max(150).email(),
});

export const RegisterSchema = z.object({
  email: z.string().min(1).max(150).email(),
  password: z
    .string()
    .min(6)
    .max(32)
    .regex(/^(?=.*[A-Z])(?=.*[a-z]).+$/),
});

export const VerifyOtpSchema = z.object({
  otp: z
    .string()
    .min(1)
    .regex(/^\d{6}$/),
  verifyId: z.string().min(1).max(36),
});

const CompleteRegisterBaseSchema = z.object({
  password: z
    .string()
    .min(6)
    .max(32)
    .regex(/^(?=.*[A-Z])(?=.*[a-z]).+$/),
  confirmPassword: z.string().min(1),
});

export const CompleteRegisterSchema = CompleteRegisterBaseSchema.refine(
  (d) => d.password === d.confirmPassword,
  {
    path: ["confirmPassword"],
    message: "notMatch",
  },
);

// ── Inferred Types ─────────────────────────────────────
export type LoginFormData = z.infer<typeof LoginSchema>;
export type RegisterFormData = z.infer<typeof RegisterSchema>;
export type VerifyOtpFormData = z.infer<typeof VerifyOtpSchema>;
export const CompleteRegisterBaseShape = CompleteRegisterBaseSchema;
