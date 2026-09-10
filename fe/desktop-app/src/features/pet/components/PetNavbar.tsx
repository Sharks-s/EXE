import { useTranslation } from "react-i18next";

export type PetTab = "my-pets" | "shop";

type PetNavbarProps = {
    activeTab: PetTab;
    onChangeTab: (tab: PetTab) => void;
};

export function PetNavbar({ activeTab, onChangeTab }: PetNavbarProps) {
    const { t } = useTranslation("common");

    return (
        <nav className="pet-navbar">
            <button
                type="button"
                className={activeTab === "my-pets" ? "active" : ""}
                onClick={() => onChangeTab("my-pets")}
            >
                🐾 {t("common:pet.my_pets")}
            </button>

            <button
                type="button"
                className={activeTab === "shop" ? "active" : ""}
                onClick={() => onChangeTab("shop")}
            >
                🛒 {t("common:pet.shop")}
            </button>
        </nav>
    );
}