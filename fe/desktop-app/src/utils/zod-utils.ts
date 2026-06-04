import { z } from "zod";

// Bóc vỏ ZodOptional / ZodNullable / ZodDefault / ZodEffects
// để lấy được ZodString bên trong
function unwrap(schema: z.ZodTypeAny): z.ZodTypeAny {
  let current = schema;
  while (true) {
    if (
      current instanceof z.ZodOptional ||
      current instanceof z.ZodNullable ||
      current instanceof z.ZodDefault
    ) {
      current = current._def.innerType;
    } else if (current instanceof z.ZodEffects) {
      current = current._def.schema;
    } else {
      break;
    }
  }
  return current;
}

// Đọc min/max từ ZodString checks
// Dùng để hiển thị hint dưới input: "6-32 ký tự"
// Chạy ngoài component (module level) để không tính lại mỗi render
export function getStringLimits(schema: z.ZodTypeAny) {
  const current = unwrap(schema);

  if (!(current instanceof z.ZodString)) {
    return { min: undefined, max: undefined };
  }

  const checks = current._def.checks;
  const min = checks.find((c) => c.kind === "min")?.value;
  const max = checks.find((c) => c.kind === "max")?.value;

  return { min, max };
}
