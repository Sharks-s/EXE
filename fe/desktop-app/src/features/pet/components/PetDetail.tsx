import { useTranslation } from "react-i18next";
import type { UserPet } from "../types/pet.type";
import { formatPetCode, getPetEmoji, getPetTheme } from "../utils/pet.helpers";
import { PetAnimation } from "./PetAnimation";

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
        return null;
    }

    const theme = getPetTheme(pet.code);

    return (
        <div
            className="pet-detail-backdrop"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <aside className="pet-detail pet-detail-horizontal">
                <button className="close-detail" type="button" onClick={onClose}>
                    ×
                </button>

                <div className="pet-detail-sidebar">
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
                </div>

                <div className="pet-detail-main">
                    <div className="detail-activities">
                        <h3>{t("common:pet.activities")}</h3>
                        <div className="activities-grid">
                            {['working', 'sleep', 'angry', 'remind', 'question'].map(activity => (
                                <div key={activity} className="activity-item">
                                    <div className="activity-image-wrapper">
                                        <PetAnimation code={pet.code} activity={activity} />
                                    </div>
                                    <span className="activity-label">{t(`common:pet.activity.${activity}`)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    );
}