import { useState } from "react";
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
    id: "beginner",
    name: "Beginner",
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

  const currentPlanLabel = "Bạn đang là một Beginner";
  const [openFaq, setOpenFaq] = useState<number | null>(null);


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
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>

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

function PlanCard({ plan }: { plan: Plan }) {
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
          disabled={plan.id === "beginner"}
          type="button"
        >
          {plan.buttonLabel}
        </button>
      </div>
    </div>
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

