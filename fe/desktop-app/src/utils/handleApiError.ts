// utils/handleApiError.ts
import axios from "axios";
import i18n from "@/i18n";
import { parseApiError } from "./error-mapper";
import { toast } from "@/shared/store/toastStore";
import type { ApiErrorResponse } from "@/types";

interface HandleApiErrorOptions {
    /** Prefix để log console, ví dụ "[useAnalytics]" — BẮT BUỘC để dễ trace khi debug prod */
    context: string;
    /** Mô tả ngắn hành động đang làm khi lỗi xảy ra, ví dụ "Lỗi tải thống kê" — dùng cho console.error */
    action?: string;
    /** Message fallback nếu không parse được lỗi cụ thể (mặc định lấy SYS_001) */
    fallbackMessage?: string;
    /** true = chỉ log, không bắn toast (dùng khi có nơi khác gộp toast, ví dụ Promise.allSettled) */
    silent?: boolean;
    /**
     * Khoá dedupe: nếu truyền vào, cùng 1 key sẽ không bắn toast lặp lại
     * trong khoảng `dedupeMs` kể từ lần bắn trước — tránh spam toast khi user
     * bấm liên tục (đổi tháng, retry...) trong lúc BE đang lỗi.
     */
    dedupeKey?: string;
    dedupeMs?: number;
}

// Module-level cache cho cơ chế dedupe toast — không phụ thuộc vào implementation của toastStore
const lastToastAtByKey = new Map<string, number>();
const DEFAULT_DEDUPE_MS = 4000;

/**
 * Xử lý lỗi API một cách THỐNG NHẤT cho toàn bộ app:
 * - Luôn log console với prefix rõ nguồn (để debug prod/staging)
 * - Luôn parse lỗi qua parseApiError (ưu tiên message nghiệp vụ cụ thể từ BE)
 * - Bắn toast (trừ khi silent), có dedupe theo dedupeKey nếu cần
 *
 * Lưu ý: KHÔNG xử lý 401 ở đây — 401/refresh-token đã có interceptor toàn cục
 * trong axios.ts lo (kèm event "auth:session-expired"), tránh xử lý trùng lặp.
 *
 * @returns message cuối cùng đã hiển thị/parse được, để nơi gọi có thể tái sử dụng nếu cần
 */
export function handleApiError(err: unknown, options: HandleApiErrorOptions): string {
    const {
        context,
        action = "Lỗi gọi API",
        fallbackMessage,
        silent = false,
        dedupeKey,
        dedupeMs = DEFAULT_DEDUPE_MS,
    } = options;

    let message: string;

    if (axios.isAxiosError<ApiErrorResponse>(err) && err.response?.data) {
        const { globalMessage } = parseApiError(err.response.data);
        message =
            globalMessage ||
            fallbackMessage ||
            i18n.t("businessErrors:SYS_001", { defaultValue: "Lỗi hệ thống, vui lòng thử lại sau" });
    } else {
        // Lỗi không phải AxiosError có response.data (network error, timeout, lỗi JS...)
        message =
            fallbackMessage ??
            i18n.t("businessErrors:SYS_001", { defaultValue: "Lỗi hệ thống, vui lòng thử lại sau" });
    }

    // Luôn log — kể cả khi silent — để không bao giờ "nuốt" lỗi âm thầm
    console.error(`${context} ${action}:`, err);

    if (!silent) {
        if (dedupeKey) {
            const now = Date.now();
            const lastAt = lastToastAtByKey.get(dedupeKey) ?? 0;
            if (now - lastAt >= dedupeMs) {
                lastToastAtByKey.set(dedupeKey, now);
                toast.error(message);
            }
            // else: bỏ qua toast lần này vì vừa bắn quá gần đây, nhưng vẫn đã log console ở trên
        } else {
            toast.error(message);
        }
    }

    return message;
}

/**
 * Dùng khi có nhiều request chạy song song (Promise.allSettled) và muốn
 * gộp lại thành 1 toast duy nhất thay vì bắn N toast riêng lẻ.
 *
 * - 0 lỗi: không làm gì
 * - 1 lỗi: hiển thị đúng message cụ thể của lỗi đó (qua parseApiError)
 * - >1 lỗi: hiển thị message gộp (groupedMessage), đồng thời log từng lỗi ra console
 */
export function handleBatchApiErrors(
    errors: unknown[],
    options: {
        context: string;
        action?: string;
        groupedMessage: string;
        dedupeKey?: string;
        dedupeMs?: number;
    },
): void {
    if (errors.length === 0) return;

    const { context, action, groupedMessage, dedupeKey, dedupeMs } = options;

    if (errors.length === 1) {
        handleApiError(errors[0], { context, action, fallbackMessage: groupedMessage, dedupeKey, dedupeMs });
        return;
    }

    // Nhiều lỗi cùng lúc — log từng cái, chỉ bắn 1 toast gộp
    errors.forEach((err, idx) => {
        console.error(`${context} ${action ?? "Lỗi gọi API"} (#${idx + 1}/${errors.length}):`, err);
    });

    if (dedupeKey) {
        const now = Date.now();
        const lastAt = lastToastAtByKey.get(dedupeKey) ?? 0;
        if (now - lastAt >= (dedupeMs ?? DEFAULT_DEDUPE_MS)) {
            lastToastAtByKey.set(dedupeKey, now);
            toast.error(groupedMessage);
        }
    } else {
        toast.error(groupedMessage);
    }
}