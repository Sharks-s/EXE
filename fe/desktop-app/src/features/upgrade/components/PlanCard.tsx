import { useTranslation } from "react-i18next";
import type { Plan } from "../types/subscription.types";

export interface PlanCardProps {
    plan: Plan;
    isCurrentPlan: boolean;
    isProActive: boolean;
    onUpgradeClick: () => void;
}

export function PlanCard({ plan, isCurrentPlan, isProActive, onUpgradeClick }: PlanCardProps) {
    const { t } = useTranslation("common");
    const isFreePlan = plan.id === "free";
    const isProPlan = plan.id === "pro";
    const isCurrent = isCurrentPlan || (isProPlan && isProActive);

    const buttonLabel = isFreePlan
        ? t("upgrade.plan_free_btn")
        : isProPlan && isProActive
            ? t("upgrade.plan_pro_btn_renew")
            : plan.buttonLabel;

    return (
        <div className={`plan-card ${plan.highlight ? "highlight" : ""} ${isCurrent ? "current" : ""}`}>
            {plan.highlight && <div className="plan-stripe" />}
            {isCurrent ? (
                <div className="plan-status-badge">
                    <span className="material-symbols-outlined">check_circle</span>
                    {isProPlan ? t("upgrade.current_plan_pro") : t("upgrade.plan_free_btn")}
                </div>
            ) : plan.highlight ? (
                <div className="popular-badge">{t("upgrade.plan_popular_badge")}</div>
            ) : null}

            <div className="plan-content">
                <div className="plan-header">
                    <div className="plan-icon">
                        <span className="material-symbols-outlined">
                            {isProPlan ? "workspace_premium" : "person"}
                        </span>
                    </div>
                    <div>
                        <h3>{plan.name}</h3>
                        <p>{plan.tagline}</p>
                    </div>
                </div>

                <div className="plan-price">
                    <span>{plan.price}</span>
                    <small>{plan.period}</small>
                </div>

                <div className="plan-divider" />

                <div className="feature-list">
                    {plan.features.map((feature) => (
                        <div key={feature} className="feature-item">
                            <span className="check-icon material-symbols-outlined">check</span>
                            <p>{feature}</p>
                        </div>
                    ))}

                    {plan.yearlyPrice && (
                        <div className="feature-item yearly-payment">
                            <span className="check-icon material-symbols-outlined">check</span>
                            <p>
                                <span className="old-price">{plan.yearlyOldPrice}</span>{" "}
                                <span className="new-price">
                                    {plan.yearlyPrice} {plan.yearlyPeriod}
                                </span>{" "}
                                {t("upgrade.plan_yearly_payment")}
                            </p>
                        </div>
                    )}
                </div>

                <button
                    className={`plan-button ${plan.highlight ? "primary" : ""}`}
                    disabled={isFreePlan}
                    type="button"
                    onClick={onUpgradeClick}
                >
                    {buttonLabel}
                </button>
            </div>
        </div>
    );
}
