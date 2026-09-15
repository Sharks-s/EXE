import type { FaqItem } from "../types/subscription.types";

export interface FaqItemComponentProps {
    item: FaqItem;
    open: boolean;
    onToggle: () => void;
}

export function FaqItemComponent({ item, open, onToggle }: FaqItemComponentProps) {
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