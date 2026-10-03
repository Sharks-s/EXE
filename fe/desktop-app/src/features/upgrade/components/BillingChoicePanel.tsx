import { useTranslation } from "react-i18next";
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
    const { t } = useTranslation("common");
    const isMonthly = selectedBilling === "monthly";
    const isWaiting = paymentState === "waiting";
    const isSuccess = paymentState === "success";

    if (isSuccess) {
        return (
            <section className="billing-choice-panel" aria-label={t("upgrade.billing_success_aria")}>
                <div className="payment-success-panel">
                    <p>{t("upgrade.billing_success_title")}</p>
                    <p className="hint">{t("upgrade.billing_success_desc")}</p>
                </div>
            </section>
        );
    }

    return (
        <section className="billing-choice-panel" aria-label={t("upgrade.billing_choice_aria")}>
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                    <p>{t("upgrade.billing_waiting_title")}</p>
                    <p className="hint">
                        {t("upgrade.billing_waiting_desc")}
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
                        ? t("upgrade.billing_submitting")
                        : (isMonthly ? t("upgrade.billing_confirm_btn_monthly") : t("upgrade.billing_confirm_btn_yearly"))}
                </button>
            )}
        </section>
    );
}
