import { useTranslation } from "react-i18next";
import type { UserPet } from "../types/pet.type";
import { formatPetCode, getPetEmoji, getPetTheme } from "../utils/pet.helpers";

type PetDetailProps = {
    pet: UserPet | null;
    loading: boolean;
    onClose: () => void;
    onRename: () => void;
    onUpgrade: () => void;
};

export function PetDetail({
    pet,
    loading,
    onClose,
    onRename,
    onUpgrade,
}: PetDetailProps) {
    const { t } = useTranslation("common");

    if (!pet) {
        return (
            <aside className="pet-detail empty-detail">
                <p>{t("common:pet.select_companion")}</p>
            </aside>
        );
    }

    const theme = getPetTheme(pet.code);

    return (
        <aside className="pet-detail">
            <button className="close-detail" type="button" onClick={onClose}>
                ×
            </button>

            <div className={`detail-image ${theme}`}>
                {pet.imageUrl ? (
                    <img src={pet.imageUrl} alt={pet.customName} />
                ) : (
                    <span>{getPetEmoji(pet.code)}</span>
                )}
            </div>

            <div className="detail-name">
                <h2>{pet.customName}</h2>
                <p>{formatPetCode(pet.code)}</p>
            </div>

            <div className="detail-level-box">
                <div className="detail-level-header">
                    <span>{t("common:pet.level_label")}</span>
                    <strong>{pet.level} / 25</strong>
                </div>

                <div className="detail-level-line">
                    <div
                        style={{
                            width: `${Math.min((pet.level / 25) * 100, 100)}%`,
                        }}
                    />
                </div>

                <small>
                    {t("common:pet.levels_to_max", {
                        count: Math.max(25 - pet.level, 0),
                    })}
                </small>
            </div>

            <div className="detail-info">
                <div>
                    <span>{t("common:pet.status")}</span>
                    <strong className={pet.equipped ? "green-text" : ""}>
                        {pet.equipped
                            ? t("common:pet.equipped")
                            : t("common:pet.not_equipped")}
                    </strong>
                </div>

                <div>
                    <span>{t("common:pet.type")}</span>
                    <strong>
                        {pet.premium
                            ? t("common:pet.premium")
                            : t("common:pet.normal")}
                    </strong>
                </div>
            </div>

            {pet.equipped && (
                <div className="equipped-panel">
                    🛡 {t("common:pet.equipped_notice")}
                </div>
            )}

            <div className="detail-actions">
                <button
                    type="button"
                    disabled={loading}
                    onClick={onRename}
                >
                    ✎ {t("common:pet.rename")}
                </button>

                <button
                    type="button"
                    disabled={loading}
                    onClick={onUpgrade}
                >
                    ↗ {t("common:pet.upgrade")}
                </button>
            </div>
        </aside>
    );
}