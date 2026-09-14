import { useEffect, useState } from "react";
import { profileApi } from "@/features/profile";
import { useFocusStore } from "@/features/focus-session";
import { toast } from "@/shared/store/toastStore";
import {
  subscriptionApi,
  type UpgradeProPlanCode,
} from "../api/subscription.api";
import "./UpgradePage.css";

export type Plan = {
  id: string;
  name: string;
  price: string;
  period: string;
  yearlyOldPrice: string;
  yearlyPrice: string;
  yearlyPeriod: string;
  tagline: string;
  features: string[];
  buttonLabel: string;
  highlight: boolean;
};

export type FaqItem = {
  q: string;
  a: string;
};


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

type BillingOption = "monthly" | "yearly";

export default function UpgradePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedBilling, setSelectedBilling] =
    useState<BillingOption | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isProActive, setIsProActive] = useState(false);
  const currentPlanLabel = isProActive
    ? "Bạn đang là Pro"
    : "Bạn đang là Free";

  useEffect(() => {
    let cancelled = false;

    profileApi
      .getDailyUsage()
      .then((usage) => {
        if (!cancelled) setIsProActive(usage.unlimited);
      })
      .catch((err) => {
        console.error("[UpgradePage] Failed to load current subscription:", err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpgradeClick = (plan: Plan) => {
    if (plan.id !== "pro") return;
    setSelectedBilling("monthly");
  };

  const handleConfirmBilling = async () => {
    if (!selectedBilling) return;

    const planCode: UpgradeProPlanCode =
      selectedBilling === "monthly" ? "PRO_MONTHLY" : "PRO_YEARLY";

    setIsUpgrading(true);
    try {
      const upgradedSubscription = await subscriptionApi.upgradePro(planCode);
      const previousUsage = useFocusStore.getState().dailyUsage;
      useFocusStore.getState().setDailyUsage({
        dailyUsedMinutes: previousUsage?.dailyUsedMinutes ?? 0,
        dailyLimitMinutes: null,
        unlimited: upgradedSubscription.unlimited,
      });
      profileApi
        .getDailyUsage()
        .then((usage) => {
          useFocusStore.getState().setDailyUsage({
            dailyUsedMinutes: usage.dailyUsedMinute,
            dailyLimitMinutes: usage.dailyLimitMinute,
            unlimited: usage.unlimited,
          });
        })
        .catch((err) => {
          console.error("[UpgradePage] Failed to refresh daily usage:", err);
        });
      setIsProActive(true);
      toast.success("Nâng cấp Pro thành công. Bạn đã được dùng không giới hạn.");
    } catch (err) {
      console.error("[UpgradePage] Upgrade Pro failed:", err);
      toast.error("Không thể nâng cấp Pro lúc này. Vui lòng thử lại.");
    } finally {
      setIsUpgrading(false);
    }
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
              isCurrentPlan={isProActive ? plan.id === "pro" : plan.id === "free"}
              onUpgradeClick={() => handleUpgradeClick(plan)}
            />
          ))}
        </div>

        {selectedBilling && (
          <BillingChoicePanel
            selectedBilling={selectedBilling}
            onSelect={setSelectedBilling}
            isSubmitting={isUpgrading}
            onConfirm={handleConfirmBilling}
          />
        )}

        <p className="pricing-note">
          Tất cả giá chưa bao gồm VAT · Thanh toán hàng tháng · Không cam kết dài hạn
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

function PlanCard({
  plan,
  isCurrentPlan,
  onUpgradeClick,
}: {
  plan: Plan;
  isCurrentPlan: boolean;
  onUpgradeClick: () => void;
}) {
  return (
    <div className={`plan-card ${plan.highlight ? "highlight" : ""}`}>
      {plan.highlight && <div className="plan-stripe" />}

      {plan.highlight && <div className="popular-badge">PHỔ BIẾN NHẤT</div>}

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
  <span className="old-price">
    {plan.yearlyOldPrice}
  </span>{" "}

  <span className="new-price">
    {plan.yearlyPrice} {plan.yearlyPeriod}
  </span>{" "}

  nếu thanh toán theo năm
</p>
    </div>
  )}
</div>

        <button
          className={`plan-button ${plan.highlight ? "primary" : ""}`}
          disabled={isCurrentPlan || plan.id === "free"}
          type="button"
          onClick={onUpgradeClick}
        >
          {isCurrentPlan
            ? "Gói hiện tại"
            : plan.id === "free"
              ? "Gói Free"
              : plan.buttonLabel}
        </button>
      </div>
    </div>
  );
}

function BillingChoicePanel({
  selectedBilling,
  onSelect,
  isSubmitting,
  onConfirm,
}: {
  selectedBilling: BillingOption;
  onSelect: (option: BillingOption) => void;
  isSubmitting: boolean;
  onConfirm: () => void;
}) {
  const isMonthly = selectedBilling === "monthly";

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

      <button
        type="button"
        className="billing-confirm-button"
        onClick={onConfirm}
        disabled={isSubmitting}
      >
        {isSubmitting
          ? "Đang nâng cấp..."
          : `Tiếp tục với ${isMonthly ? "gói tháng" : "gói năm"}`}
      </button>
    </section>
  );
}

function FaqItemComponent({
  item,
  open,
  onToggle,
}: {
  item: FaqItem;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="faq-item">
      <button onClick={onToggle} type="button" className="faq-question">
        <span>{item.q}</span>
        <span className={`faq-arrow ${open ? "open" : ""}`}>⌄</span>
      </button>

      {open && (
        <div className="faq-answer">
          <p>{item.a}</p>
        </div>
      )}
    </div>
  );
}

