import { useCallback, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useCurrentPlan } from "../hooks/useCurrentPlan";
import { useUpgradePayment } from "../hooks/useUpgradePayment";
import { PlanCard } from "../components/PlanCard";
import { BillingChoicePanel } from "../components/BillingChoicePanel";
import { FaqItemComponent } from "../components/FaqItemComponent";
import type { BillingOption, FaqItem, Plan } from "../types/subscription.types";
import "./UpgradePage.css";

const getPlans = (t: any): Plan[] => [
  {
    id: "free",
    name: "Free",
    price: "",
    period: "",
    yearlyOldPrice: "",
    yearlyPrice: "",
    yearlyPeriod: "",
    tagline: t("upgrade.plan_free_tagline"),
    features: t("upgrade.plan_free_features", { returnObjects: true }),
    buttonLabel: t("upgrade.plan_free_btn"),
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "49.000đ",
    period: t("upgrade.period_month"),
    yearlyOldPrice: "599.000đ",
    yearlyPrice: "399.000đ",
    yearlyPeriod: t("upgrade.period_year"),
    tagline: t("upgrade.plan_pro_tagline"),
    features: t("upgrade.plan_pro_features", { returnObjects: true }),
    buttonLabel: t("upgrade.plan_pro_btn"),
    highlight: true,
  },
];

const faqItems: FaqItem[] = [];

export default function UpgradePage() {
  const { t } = useTranslation("common");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedBilling, setSelectedBilling] =
    useState<BillingOption | null>(null);

  const { isProActive, setIsProActive } = useCurrentPlan();
  const { paymentState, isUpgrading, startUpgrade, resetPayment } =
    useUpgradePayment(() => setIsProActive(true));

  const plans = useMemo(() => getPlans(t), [t]);

  const currentPlanLabel = isProActive ? t("upgrade.current_plan_pro") : t("upgrade.current_plan_free");

  const handleUpgradeClick = (plan: Plan) => {
    if (plan.id !== "pro") return;
    resetPayment();
    setSelectedBilling("monthly");
  };

  const handleConfirmBilling = () => {
    if (!selectedBilling) return;
    const planCode = selectedBilling === "monthly" ? "PRO_MONTHLY" : "PRO_YEARLY";
    void startUpgrade(planCode);
  };

  const handleCloseBilling = useCallback(() => {
    if (paymentState === "success") resetPayment();
    setSelectedBilling(null);
  }, [paymentState, resetPayment]);

  const isBillingModalOpen = selectedBilling !== null || paymentState === "success";

  return (
    <div className="upgrade-page">
      <header className="upgrade-header app-page-header">
        <div className="app-page-title">
          <div className="app-page-title-row">
            <span className="app-page-title-icon">
              <span className="material-symbols-outlined">workspace_premium</span>
            </span>
            <h1>{t("upgrade.header_title")}</h1>
          </div>
          <p>{t("upgrade.header_subtitle")}</p>
        </div>

        <div className="current-plan-badge app-page-actions">
          <span>{currentPlanLabel}</span>
        </div>
      </header>

      <main className="upgrade-body">
        <div className="pricing-grid">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={!isProActive && plan.id === "free"}
              isProActive={isProActive}
              onUpgradeClick={() => handleUpgradeClick(plan)}
            />
          ))}
        </div>

        {isBillingModalOpen && (
          <BillingChoicePanel
            selectedBilling={selectedBilling ?? "monthly"}
            onSelect={setSelectedBilling}
            isSubmitting={isUpgrading}
            paymentState={paymentState}
            onConfirm={handleConfirmBilling}
            onClose={handleCloseBilling}
          />
        )}

        <p className="pricing-note">
          {t("upgrade.pricing_note")}
        </p>

        <section className="faq-section">
          <div className="faq-header">
            <h2>{t("upgrade.faq_title")}</h2>
            <p>{t("upgrade.faq_contact")}</p>
          </div>

          <div className="faq-list">
            {faqItems.map((item, index) => (
              <FaqItemComponent
                key={index}
                item={item}
                open={openFaq === index}
                onToggle={() => setOpenFaq(openFaq === index ? null : index)}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}