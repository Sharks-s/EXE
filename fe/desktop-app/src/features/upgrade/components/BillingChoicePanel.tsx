import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import type { BillingOption, PaymentState } from "../types/subscription.types";

export interface BillingChoicePanelProps {
    selectedBilling: BillingOption;
    onSelect: (option: BillingOption) => void;
    isSubmitting: boolean;
    paymentState: PaymentState;
    onConfirm: () => void;
    onClose: () => void;
}

export function BillingChoicePanel({
    selectedBilling,
    onSelect,
    isSubmitting,
    paymentState,
    onConfirm,
    onClose,
}: BillingChoicePanelProps) {
    const { t } = useTranslation("common");
    const isMonthly = selectedBilling === "monthly";
    const isWaiting = paymentState === "waiting";
    const isSuccess = paymentState === "success";
    // Chỉ khóa đóng popup lúc đang khởi tạo giao dịch; khi đang chờ SePay vẫn cho đóng (polling chạy nền).
    const canClose = !isSubmitting || isWaiting;

    useEffect(() => {
        const handleKey = (event: KeyboardEvent) => {
            if (event.key === "Escape" && canClose) onClose();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [canClose, onClose]);

    const content = isSuccess ? (
        <section
            className="billing-choice-panel billing-modal billing-modal-success"
            role="dialog"
            aria-modal="true"
            aria-label={t("upgrade.billing_success_aria")}
            onClick={(event) => event.stopPropagation()}
        >
            <div className="payment-success-panel">
                <div className="payment-success-icon">
                    <span className="material-symbols-outlined">workspace_premium</span>
                </div>
                <p className="payment-success-title">{t("upgrade.billing_success_title")}</p>
                <p className="hint">{t("upgrade.billing_success_desc")}</p>
                <button type="button" className="billing-confirm-button" onClick={onClose}>
                    {t("upgrade.billing_success_btn")}
                </button>
            </div>
        </section>
    ) : (
        <section
            className="billing-choice-panel billing-modal"
            role="dialog"
            aria-modal="true"
            aria-label={t("upgrade.billing_choice_aria")}
            onClick={(event) => event.stopPropagation()}
        >
            <button
                type="button"
                className="billing-modal-close"
                onClick={onClose}
                disabled={!canClose}
                aria-label={t("upgrade.billing_close")}
                title={t("upgrade.billing_close")}
            >
                <span className="material-symbols-outlined">close</span>
            </button>

            <div className="billing-choice-header">
                <div>
                    <span>{t("upgrade.billing_plan_title")}</span>
                    <h2>{t("upgrade.billing_choice_title")}</h2>
                </div>
                <p>{isMonthly ? t("upgrade.billing_price_monthly") : t("upgrade.billing_price_yearly")}</p>
            </div>

            <div className="billing-options">
                <button
                    type="button"
                    className={`billing-option ${isMonthly ? "active" : ""}`}
                    onClick={() => onSelect("monthly")}
                    disabled={isSubmitting || isWaiting}
                >
                    <span className="billing-radio" />
                    <span className="billing-option-copy">
                        <strong>{t("upgrade.billing_monthly")}</strong>
                        <small>{t("upgrade.billing_monthly_desc")}</small>
                    </span>
                </button>

                <button
                    type="button"
                    className={`billing-option recommended ${!isMonthly ? "active" : ""}`}
                    onClick={() => onSelect("yearly")}
                    disabled={isSubmitting || isWaiting}
                >
                    <span className="billing-radio" />
                    <span className="billing-option-copy">
                        <strong>{t("upgrade.billing_yearly")}</strong>
                        <small>{t("upgrade.billing_yearly_desc")}</small>
                    </span>
                    <span className="billing-save-badge">{t("upgrade.billing_save_badge")}</span>
                </button>
            </div>

            {isWaiting ? (
                <div className="payment-waiting-panel">
                    <span className="payment-waiting-spinner" aria-hidden="true" />
                    <div>
                        <p>{t("upgrade.billing_waiting_title")}</p>
                        <p className="hint">{t("upgrade.billing_waiting_desc")}</p>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    className="billing-confirm-button"
                    onClick={onConfirm}
                    disabled={isSubmitting}
                >
                    {isSubmitting
                        ? t("upgrade.billing_submitting")
                        : (isMonthly ? t("upgrade.billing_confirm_btn_monthly") : t("upgrade.billing_confirm_btn_yearly"))}
                </button>
            )}
        </section>
    );

    return createPortal(
        <div className="billing-modal-overlay" onClick={() => canClose && onClose()}>
            {content}
        </div>,
        document.body,
    );
}
