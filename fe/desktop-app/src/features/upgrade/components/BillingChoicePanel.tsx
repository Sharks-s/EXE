import type { BillingOption, PaymentState } from "../types/subscription.types";

export interface BillingChoicePanelProps {
    selectedBilling: BillingOption;
    onSelect: (option: BillingOption) => void;
    isSubmitting: boolean;
    paymentState: PaymentState;
    onConfirm: () => void;
}

export function BillingChoicePanel({
    selectedBilling,
    onSelect,
    isSubmitting,
    paymentState,
    onConfirm,
}: BillingChoicePanelProps) {
    const isMonthly = selectedBilling === "monthly";
    const isWaiting = paymentState === "waiting";
    const isSuccess = paymentState === "success";

    if (isSuccess) {
        return (
            <section className="billing-choice-panel" aria-label="Kết quả thanh toán">
                <div className="payment-success-panel">
                    <p>🎉 Nâng cấp Pro thành công!</p>
                    <p className="hint">Bạn đã được sử dụng không giới hạn.</p>
                </div>
            </section>
        );
    }

    return (
        <section className="billing-choice-panel" aria-label="Chọn chu kỳ thanh toán">
            <div className="billing-choice-header">
                <div>
                    <span>Pro plan</span>
                    <h2>Chọn chu kỳ thanh toán</h2>
                </div>
                <p>{isMonthly ? "49.000đ / tháng" : "399.000đ / năm"}</p>
            </div>

            <div className="billing-options">
                <button
                    type="button"
                    className={`billing-option ${isMonthly ? "active" : ""}`}
                    onClick={() => onSelect("monthly")}
                    disabled={isSubmitting}
                >
                    <span className="billing-radio" />
                    <span className="billing-option-copy">
                        <strong>Theo tháng</strong>
                        <small>49.000đ / tháng · linh hoạt, dễ bắt đầu</small>
                    </span>
                </button>

                <button
                    type="button"
                    className={`billing-option recommended ${!isMonthly ? "active" : ""}`}
                    onClick={() => onSelect("yearly")}
                    disabled={isSubmitting}
                >
                    <span className="billing-radio" />
                    <span className="billing-option-copy">
                        <strong>Theo năm</strong>
                        <small>399.000đ / năm · tiết kiệm 200.000đ</small>
                    </span>
                    <span className="billing-save-badge">Tiết kiệm</span>
                </button>
            </div>

            {isWaiting ? (
                <div className="payment-waiting-panel">
                    <p>Đang chờ xác nhận thanh toán qua SePay...</p>
                    <p className="hint">
                        Vui lòng hoàn tất thanh toán trên trình duyệt vừa mở.
                    </p>
                </div>
            ) : (
                <button
                    type="button"
                    className="billing-confirm-button"
                    onClick={onConfirm}
                    disabled={isSubmitting}
                >
                    {isSubmitting
                        ? "Đang khởi tạo thanh toán..."
                        : `Tiếp tục với ${isMonthly ? "gói tháng" : "gói năm"}`}
                </button>
            )}
        </section>
    );
}
