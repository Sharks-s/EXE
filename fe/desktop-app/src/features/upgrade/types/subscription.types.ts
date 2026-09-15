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

export type BillingOption = "monthly" | "yearly";

export type PaymentState = "idle" | "waiting" | "success" | "failed";