import { z } from "zod";

const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case "too_small":
      if (issue.type === "string") {
        if (issue.minimum === 1) return { message: "notBlank" };
        return { message: "min" };
      }
      break;

    case "too_big":
      return { message: "max" };

    case "invalid_string":
      if (issue.validation === "email") return { message: "email" };
      if (issue.validation === "regex") return { message: "pattern" };
      break;

    default:
      break;
  }

  // Luôn đảm bảo fallback về string, không để lọt undefined
  return { message: ctx.defaultError || "" };
};

export function setupZodErrorMap() {
  z.setErrorMap(customErrorMap);
}
