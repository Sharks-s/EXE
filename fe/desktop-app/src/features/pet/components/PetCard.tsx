import { useTranslation } from "react-i18next";
import type { UserPet } from "../types/pet.type";
import { useLevelUpAnimation } from "../hooks/useLevelUpAnimation";
import { formatPetCode, getPetEmoji, getPetTheme } from "../utils/pet.helpers";
import {
    XP_PER_PET_LEVEL,
    canUpgradePet,
    getPetExperience,
    getPetExperienceProgress,
} from "../utils/petExperience";

type PetCardProps = {
    pet: UserPet;
    selected: boolean;
    loading: boolean;
    onSelect: () => void;
    onEquip: () => void;
    onRename: () => void;
    onUpgrade: () => void;
};

export function PetCard({
    pet,
    selected,
    loading,
    onSelect,
    onEquip,
    onRename,
    onUpgrade,
}: PetCardProps) {
    const { t } = useTranslation("common");

    const theme = getPetTheme(pet.code);
    const experienceProgress = getPetExperienceProgress(pet);
    const canUpgrade = canUpgradePet(pet);
    const experience = getPetExperience(pet);
    const isLevelingUp = useLevelUpAnimation(pet.level, 1200, pet.userPetId);

    return (
        <article
            className={[
                "pet-card",
                pet.premium ? "premium" : "",
                pet.equipped ? "equipped" : "",
                selected ? "selected" : "",
                isLevelingUp ? "level-up" : "",
            ].join(" ")}
            onClick={onSelect}
        >
            {isLevelingUp && <span className="level-up-burst">LEVEL UP</span>}

            <div className={`pet-card-cover ${theme}`}>
                {pet.premium && (
                    <span className="premium-badge">
                        <span className="material-symbols-outlined icon-fill">workspace_premium</span>
                        {t("common:pet.premium")}
                    </span>
                )}

                {pet.equipped && (
                    <span className="equipped-badge">
                        <span className="material-symbols-outlined icon-fill">check_circle</span>
                        {t("common:pet.equipped")}
                    </span>
                )}

                <span className="level-badge">
                    {t("common:pet.level", { level: pet.level })}
                </span>

                <div className="pet-image-box">
                    {pet.imageUrl ? (
                        <img src={pet.imageUrl} alt={pet.customName} />
                    ) : (
                        <span>{getPetEmoji(pet.code)}</span>
                    )}
                </div>
            </div>

            <div className="pet-card-body">
                <h3>{pet.customName}</h3>
                <p>{formatPetCode(pet.code)}</p>

                <div
                    className="level-line"
                    aria-label={`Experience ${Math.round(experienceProgress)}%`}
                    title={`${Math.min(experience, XP_PER_PET_LEVEL)} / ${XP_PER_PET_LEVEL} XP`}
                >
                    <div
                        style={{
                            width: `${experienceProgress}%`,
                        }}
                    />
                </div>

                <div className="pet-card-actions">
                    <button
                        type="button"
                        className={
                            pet.equipped
                                ? "equip-btn equipped-btn"
                                : "equip-btn"
                        }
                        disabled={pet.equipped || loading}
                        onClick={(event) => {
                            event.stopPropagation();
                            onEquip();
                        }}
                    >
                        {loading
                            ? t("common:pet.processing")
                            : pet.equipped
                                ? t("common:pet.equipped")
                                : t("common:pet.equip")}
                    </button>

                    <button
                        type="button"
                        className="icon-btn"
                        disabled={loading}
                        onClick={(event) => {
                            event.stopPropagation();
                            onRename();
                        }}
                        aria-label={t("common:pet.rename")}
                        title={t("common:pet.rename")}
                    >
                        <span className="material-symbols-outlined">edit</span>
                    </button>

                    <button
                        type="button"
                        className="icon-btn purple-icon"
                        disabled={loading || !canUpgrade}
                        onClick={(event) => {
                            event.stopPropagation();
                            onUpgrade();
                        }}
                        aria-label={t("common:pet.upgrade")}
                        title={
                            canUpgrade
                                ? t("common:pet.upgrade")
                                : t("common:pet.upgrade_locked", {
                                    defaultValue: "Cần 100 XP và chưa đạt cấp tối đa",
                                })
                        }
                    >
                        <span className="material-symbols-outlined">arrow_upward</span>
                    </button>
                </div>
            </div>
        </article>
    );
}
