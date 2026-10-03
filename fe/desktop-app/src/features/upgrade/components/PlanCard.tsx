import { useTranslation } from "react-i18next";
import type { Plan } from "../types/subscription.types";

export interface PlanCardProps {
    plan: Plan;
    isCurrentPlan: boolean;
    isProActive: boolean;
    onUpgradeClick: () => void;
}

export function PlanCard({ plan, isProActive, onUpgradeClick }: PlanCardProps) {
    const { t } = useTranslation("common");
    const isFreePlan = plan.id === "free";
    const isProPlan = plan.id === "pro";

    const buttonLabel = isFreePlan
        ? t("upgrade.plan_free_btn")
        : isProPlan && isProActive
            ? t("upgrade.plan_pro_btn_renew")
            : plan.buttonLabel;

    return (
        <div className={`plan-card ${plan.highlight ? "highlight" : ""}`}>
            {plan.highlight && <div className="plan-stripe" />}
            {plan.highlight && <div className="popular-badge">{t("upgrade.plan_popular_badge")}</div>}

            <div className="plan-content">
                <div className="plan-header">
                    <div className="plan-icon">{plan.name.charAt(0)}</div>
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
                            <span className="check-icon">✓</span>
                            <p>{feature}</p>
                        </div>
                    ))}

                    {plan.yearlyPrice && (
                        <div className="feature-item yearly-payment">
                            <span className="check-icon">✓</span>
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
