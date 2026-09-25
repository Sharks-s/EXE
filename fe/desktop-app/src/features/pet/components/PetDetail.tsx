import { useTranslation } from "react-i18next";
import type { UserPet } from "../types/pet.type";
import { useLevelUpAnimation } from "../hooks/useLevelUpAnimation";
import { formatPetCode, getPetEmoji, getPetTheme } from "../utils/pet.helpers";
import {
    MAX_PET_LEVEL,
    XP_PER_PET_LEVEL,
    canUpgradePet,
    getPetExperience,
    getPetExperienceProgress,
} from "../utils/petExperience";
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
    const isLevelingUp = useLevelUpAnimation(
        pet?.level,
        1200,
        pet?.userPetId,
    );

    if (!pet) {
        return null;
    }

    const theme = getPetTheme(pet.code);
    const experienceProgress = getPetExperienceProgress(pet);
    const experience = getPetExperience(pet);
    const canUpgrade = canUpgradePet(pet);

    return (
        <div
            className="pet-detail-backdrop"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <aside className={`pet-detail pet-detail-horizontal ${isLevelingUp ? "level-up" : ""}`}>
                {isLevelingUp && <span className="level-up-burst detail-level-up-burst">LEVEL UP</span>}

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
                            <span>
                                {t("common:pet.level", { level: pet.level })} / {MAX_PET_LEVEL}
                            </span>
                            <strong>
                                {Math.min(experience, XP_PER_PET_LEVEL)} / {XP_PER_PET_LEVEL} XP
                            </strong>
                        </div>

                        <div className="detail-level-line">
                            <div
                                style={{
                                    width: `${experienceProgress}%`,
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
                            disabled={loading || !canUpgrade}
                            onClick={onUpgrade}
                            title={
                                canUpgrade
                                    ? t("common:pet.upgrade")
                                    : t("common:pet.upgrade_locked", {
                                        defaultValue: "Need 100 XP and below max level",
                                    })
                            }
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
