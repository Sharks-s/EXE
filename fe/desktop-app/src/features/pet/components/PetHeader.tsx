import { useTranslation } from "react-i18next";

export function PetHeader() {
    const { t } = useTranslation("common");

    return (
        <header className="app-page-header">
            <div className="app-page-title">
                <div className="app-page-title-row">
                    <span className="app-page-title-icon">
                        <span className="material-symbols-outlined">pets</span>
                    </span>

                    <h1>{t("common:pet.header_title")}</h1>
                </div>

                <p>{t("common:pet.header_description")}</p>
            </div>
        </header>
    );
}