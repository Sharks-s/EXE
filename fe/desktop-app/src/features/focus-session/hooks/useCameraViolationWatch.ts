// features/focus-session/hooks/useCameraViolationWatch.ts
import { useEffect, useRef } from "react";
import { cameraApi } from "../api/cameraApi";
import type { ViolationType } from "../types/focus.types";
import type { CameraStatusResponse } from "../types/focus-camera.types";

// ── Hằng số cấu hình (giữ nguyên giá trị gốc, chưa đổi bậc thang — sẽ áp business rule ở bước sau) ──
const CAMERA_CHECK_INTERVAL_SECONDS = 3 * 60; // Nghỉ 3 phút sau khi tắt mới bật lại
const OBSERVE_WINDOW_SECONDS = 25; // Đủ 25s sạch lỗi phạt thì tắt cam
const PENALTY_THRESHOLD_STEPS_SECONDS = [7, 14, 20]; // thay cho [10, 20, 30]
const HEALTH_VIOLATION_THRESHOLD_SECONDS = 10;

type PenaltyViolationType = Extract<ViolationType, "AWAY" | "LOOK_AWAY" | "TOO_CLOSE">;
type HealthViolationType = Extract<ViolationType, "TOO_CLOSE" | "BAD_POSTURE" | "POOR_LIGHTING">;

interface UseCameraViolationWatchParams {
    sessionId: number | null;
    onPenaltyViolation: (type: PenaltyViolationType, occurrenceInScan: number) => void;
    onHealthViolation: (type: HealthViolationType) => void;
}

export function useCameraViolationWatch({
    sessionId,
    onPenaltyViolation,
    onHealthViolation,
}: UseCameraViolationWatchParams) {
    const isCameraStartedRef = useRef<boolean>(false);
    const observeWindowSecondsRef = useRef<number>(0);
    const lastCameraOffAtRef = useRef<number>(0);

    const distractCounterRef = useRef<number>(0);
    const penaltyThresholdIndexRef = useRef<number>(0); // index vào PENALTY_THRESHOLD_STEPS_SECONDS
    const penaltyCountInRowRef = useRef<number>(0);
    const currentViolationRef = useRef<PenaltyViolationType | null>(null);

    const healthViolationCounterRef = useRef<number>(0);
    const currentHealthViolationRef = useRef<HealthViolationType | null>(null);

    // Reset toàn bộ ref khi session đổi (mount lại)
    useEffect(() => {
        isCameraStartedRef.current = false;
        observeWindowSecondsRef.current = 0;
        lastCameraOffAtRef.current = 0;
        distractCounterRef.current = 0;
        penaltyThresholdIndexRef.current = 0;
        penaltyCountInRowRef.current = 0;
        currentViolationRef.current = null;
        healthViolationCounterRef.current = 0;
        currentHealthViolationRef.current = null;

        return () => {
            cameraApi.stop().catch(() => { });
            isCameraStartedRef.current = false;
        };
    }, [sessionId]);

    /**
     * Gọi mỗi giây từ interval chính bên ngoài (hook cha).
     * currentElapsed: tổng giây đã học thực tế (đã trừ break) của session.
     */
    const tick = async (currentElapsed: number, isPaused: boolean) => {
        if (!sessionId || isPaused) return;

        // ── Bật cam định kỳ (sau khi tắt, chờ đủ 3 phút) ──
        if (
            !isCameraStartedRef.current &&
            currentElapsed - lastCameraOffAtRef.current >= CAMERA_CHECK_INTERVAL_SECONDS
        ) {
            isCameraStartedRef.current = true;
            observeWindowSecondsRef.current = 0;
            distractCounterRef.current = 0;
            currentViolationRef.current = null;

            cameraApi.start().catch((err) => {
                console.error("[useCameraViolationWatch] Lỗi khởi động Cam:", err);
                isCameraStartedRef.current = false;
            });
            return;
        }

        if (!isCameraStartedRef.current) return;

        try {
            const camStatus: CameraStatusResponse | null = await cameraApi.getStatus();
            if (!camStatus) return;

            let penaltyViolation: PenaltyViolationType | null = null;
            let healthViolation: HealthViolationType | null = null;

            // Phân loại theo thứ tự ưu tiên: penalty trước, health sau
            if (!camStatus.face_detected) {
                penaltyViolation = "AWAY";
            } else if (Math.abs(camStatus.yaw) > 25 || camStatus.pitch < -20) {
                penaltyViolation = "LOOK_AWAY";
            } else if (!camStatus.checks.close_enough) {
                healthViolation = "TOO_CLOSE";
            } else if (!camStatus.checks.shoulders_visible) {
                healthViolation = "BAD_POSTURE";
            } else if (!camStatus.checks.lighting_ok) {
                healthViolation = "POOR_LIGHTING";
            }

            // ── NHÓM PHẠT THẬT ──
            if (penaltyViolation) {
                observeWindowSecondsRef.current = 0; // đập khung 25s quan sát về 0

                if (currentViolationRef.current === penaltyViolation) {
                    distractCounterRef.current += 1;
                } else {
                    currentViolationRef.current = penaltyViolation;
                    distractCounterRef.current = 1;
                }

                const currentThreshold =
                    PENALTY_THRESHOLD_STEPS_SECONDS[
                    Math.min(penaltyThresholdIndexRef.current, PENALTY_THRESHOLD_STEPS_SECONDS.length - 1)
                    ];

                if (distractCounterRef.current >= currentThreshold) {
                    const violationType = currentViolationRef.current;
                    distractCounterRef.current = 0;
                    currentViolationRef.current = null;
                    penaltyCountInRowRef.current += 1;

                    onPenaltyViolation(violationType, penaltyCountInRowRef.current);

                    penaltyThresholdIndexRef.current = Math.min(
                        penaltyThresholdIndexRef.current + 1,
                        PENALTY_THRESHOLD_STEPS_SECONDS.length - 1,
                    );
                }
            } else {
                if (distractCounterRef.current > 0) distractCounterRef.current = 0;
                currentViolationRef.current = null;
            }

            // ── NHÓM SỨC KHỎE (độc lập) ──
            if (healthViolation) {
                if (currentHealthViolationRef.current === healthViolation) {
                    healthViolationCounterRef.current += 1;
                } else {
                    currentHealthViolationRef.current = healthViolation;
                    healthViolationCounterRef.current = 1;
                }

                if (healthViolationCounterRef.current >= HEALTH_VIOLATION_THRESHOLD_SECONDS) {
                    const hType = currentHealthViolationRef.current;
                    healthViolationCounterRef.current = 0;
                    currentHealthViolationRef.current = null;
                    onHealthViolation(hType);
                }
            } else {
                if (healthViolationCounterRef.current > 0) healthViolationCounterRef.current = 0;
                currentHealthViolationRef.current = null;
            }

            // ── TẮT CAM KHI ĐỦ 25S SẠCH ──
            if (!penaltyViolation) {
                observeWindowSecondsRef.current += 1;

                if (observeWindowSecondsRef.current >= OBSERVE_WINDOW_SECONDS) {
                    await cameraApi.stop().catch(() => { });
                    isCameraStartedRef.current = false;
                    observeWindowSecondsRef.current = 0;
                    lastCameraOffAtRef.current = currentElapsed;

                    // Reset bậc thang — đợt quét sau bắt đầu lại từ đầu
                    penaltyThresholdIndexRef.current = 0;
                    penaltyCountInRowRef.current = 0;
                }
            }
        } catch (err) {
            console.error("[useCameraViolationWatch] Lỗi xử lý data camera:", err);
        }
    };
    const stopCamera = () => {
        cameraApi.stop().catch(() => { });
        isCameraStartedRef.current = false;
    };

    return { tick, stopCamera };
}