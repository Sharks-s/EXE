import { useTranslation } from "react-i18next";

export function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const currentLang = i18n.language?.startsWith("vi") ? "vi" : "en";

    const toggleLanguage = () => {
        const next = currentLang === "vi" ? "en" : "vi";
        i18n.changeLanguage(next);
    };

    return (
        <button
            type="button"
            onClick={toggleLanguage}
            className="group relative inline-flex h-14 w-14 items-center justify-center rounded-full border border-amber-500 bg-gradient-to-br from-amber-300 via-amber-400 to-orange-400 shadow-[0_0_20px_rgba(251,191,36,0.6)] hover:scale-110 hover:border-amber-200 hover:shadow-[0_0_30px_rgba(251,191,36,0.9)] active:scale-95 transition-all duration-300 select-none"
            title={`Chuyển sang ${currentLang === "vi" ? "English" : "Tiếng Việt"}`}
        >
            {/* Vòng hào quang mặt trời nhẹ phía sau */}
            <span className="absolute inset-0 rounded-full bg-amber-400/30 blur-md group-hover:blur-lg transition-all" />

            {/* Cụm Nội dung căn giữa */}
            <div className="relative z-10 flex flex-col items-center justify-center leading-none">
                <span className="text-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
                    {currentLang === "vi" ? "🇻🇳" : "🇬🇧"}
                </span>
                <span className="mt-1 text-[10px] font-black tracking-wider text-amber-950">
                    {currentLang === "vi" ? "VI" : "EN"}
                </span>
            </div>
        </button>
    );
}