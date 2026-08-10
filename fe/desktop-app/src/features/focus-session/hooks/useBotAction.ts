// features/focus-session/hooks/useBotAction.ts
import { useRef } from "react";
import { emit } from "@tauri-apps/api/event";

const DEFAULT_BUBBLE_DURATION_MS = 6000;

// Số càng lớn càng ưu tiên. Action ưu tiên thấp hơn action đang hiển thị sẽ bị xếp hàng chờ (nếu là health).
const PRIORITY_RANK: Record<ActionPriority, number> = {
    penalty: 2,
    health: 1,
};

export type ActionPriority = "penalty" | "health";

interface ShowBotActionParams {
    message: string;
    actions?: any[];
    action?: string;
    priority: ActionPriority;
    durationMs?: number;
}

export function useBotAction() {
    const currentPriorityRef = useRef<ActionPriority | null>(null);
    const hideTimerRef = useRef<number | null>(null);
    // Hàng đợi FIFO — hiện tại chỉ chứa các action "health" bị chặn tạm thời bởi "penalty"
    const healthQueueRef = useRef<ShowBotActionParams[]>([]);

    const emitBubble = (params: ShowBotActionParams) => {
        const { message, actions = [], action, durationMs = DEFAULT_BUBBLE_DURATION_MS } = params;

        currentPriorityRef.current = params.priority;

        emit("bot-bubble-update", {
            message,
            actions,
            isVisible: true,
            action,
        });

        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = window.setTimeout(() => {
            onBubbleExpired();
        }, durationMs);
    };

    const onBubbleExpired = () => {
        emit("bot-bubble-update", {
            message: null,
            actions: undefined,
            isVisible: false,
            action: undefined,
        });
        currentPriorityRef.current = null;

        // Sau khi tắt, nếu còn health đang xếp hàng -> lấy cái đầu tiên (FIFO) ra hiện tiếp
        const next = healthQueueRef.current.shift();
        if (next) {
            emitBubble(next);
        }
    };

    const showBotAction = (params: ShowBotActionParams) => {
        const { priority } = params;

        // Không có gì đang hiện -> hiện luôn
        if (currentPriorityRef.current === null) {
            emitBubble(params);
            return;
        }

        // Action mới ưu tiên cao hơn hoặc bằng -> ghi đè ngay
        if (PRIORITY_RANK[priority] >= PRIORITY_RANK[currentPriorityRef.current]) {
            // Nếu action mới là "penalty" -> xóa sạch hàng đợi health cũ (không cần giữ để hiện sau nữa)
            if (priority === "penalty") {
                healthQueueRef.current = [];
            }
            emitBubble(params);
            return;
        }

        // Action mới ưu tiên thấp hơn (health khi đang hiện penalty) -> xếp hàng chờ
        if (priority === "health") {
            healthQueueRef.current.push(params);
        }
    };

    return { showBotAction };
}