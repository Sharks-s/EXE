import type { ApiErrorResponse } from "@/types";
import i18n from "@/i18n";
import viBusinessErrors from "@/i18n/locales/vi/businessErrors.json";
import enBusinessErrors from "@/i18n/locales/en/businessErrors.json";

const businessDict: Record<string, Record<string, string>> = {
  vi: viBusinessErrors,
  en: enBusinessErrors,
};

export function parseApiError(errorData: ApiErrorResponse) {
  const fieldErrors: Record<string, string> = {};
  let globalMessage = "";

  if (errorData.code === "VAL_001" && errorData.errors) {
    errorData.errors.forEach((err) => {
      if (err.field) fieldErrors[err.field] = err.message;
    });
    return { globalMessage, fieldErrors };
  }

  const lang = i18n.language ?? "vi";
  const dict = businessDict[lang] ?? businessDict["vi"];
  globalMessage = dict[errorData.code] ?? errorData.message ?? "Có lỗi xảy ra";

  return { globalMessage, fieldErrors };
}
