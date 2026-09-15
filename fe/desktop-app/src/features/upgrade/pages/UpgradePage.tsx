import { useState } from "react";
import { useCurrentPlan } from "../hooks/useCurrentPlan";
import { useUpgradePayment } from "../hooks/useUpgradePayment";
import { PlanCard } from "../components/PlanCard";
import { BillingChoicePanel } from "../components/BillingChoicePanel";
import { FaqItemComponent } from "../components/FaqItemComponent";
import type { BillingOption, FaqItem, Plan } from "../types/subscription.types";
import "./UpgradePage.css";

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "",
    period: "",
    yearlyOldPrice: "",
    yearlyPrice: "",
    yearlyPeriod: "",
    tagline: "Dành cho người mới bắt đầu",
    features: [
      "Tối đa 60 phút sử dụng mỗi ngày",
      "Theo dõi tập trung cơ bản",
      "Dashboard phân tích đơn giản",
      "AI assistant mặc định",
    ],
    buttonLabel: "Gói hiện tại",
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "49.000đ",
    period: "/ tháng",
    yearlyOldPrice: "599.000đ",
    yearlyPrice: "399.000đ",
    yearlyPeriod: "/ năm",
    tagline: "Dành cho người muốn tập trung nghiêm túc",
    features: [
      "Không giới hạn thời gian sử dụng",
      "AI assistant đa personality",
      "Dashboard phân tích nâng cao",
      "Chiến lược tập trung cá nhân hóa",
      "Theo dõi hành vi nâng cao",
      "Ưu tiên cập nhật và tính năng premium",
    ],
    buttonLabel: "Nâng cấp Pro",
    highlight: true,
  },
];

const faqItems: FaqItem[] = [];

export default function UpgradePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedBilling, setSelectedBilling] =
    useState<BillingOption | null>(null);

  const { isProActive, setIsProActive } = useCurrentPlan();
  const { paymentState, isUpgrading, startUpgrade, resetPayment } =
    useUpgradePayment(() => setIsProActive(true));

  const currentPlanLabel = isProActive ? "Bạn đang là Pro" : "Bạn đang là Free";

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

  return (
    <div className="upgrade-page">
      <header className="upgrade-header app-page-header">
        <div className="app-page-title">
          <div className="app-page-title-row">
            <span className="app-page-title-icon">
              <span className="material-symbols-outlined">workspace_premium</span>
            </span>
            <h1>Nâng cấp Focus Buddy</h1>
          </div>
          <p>Mở khóa các tính năng nâng cao để tối ưu hiệu suất tập trung.</p>
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

        {selectedBilling && (
          <BillingChoicePanel
            selectedBilling={selectedBilling}
            onSelect={setSelectedBilling}
            isSubmitting={isUpgrading}
            paymentState={paymentState}
            onConfirm={handleConfirmBilling}
          />
        )}

        <p className="pricing-note">
          Tất cả giá chưa bao gồm VAT · Thanh toán theo chu kỳ đã chọn · Không tự động gia hạn
        </p>

        <section className="faq-section">
          <div className="faq-header">
            <h2>Câu hỏi thường gặp</h2>
            <p>Vẫn còn thắc mắc? Liên hệ pinkydeng168@gmail.com(Lê Bọi Nhi)</p>
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