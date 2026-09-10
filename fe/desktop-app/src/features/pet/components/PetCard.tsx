import { useTranslation } from "react-i18next";
import type { UserPet } from "../types/pet.type";
import { formatPetCode, getPetEmoji, getPetTheme } from "../utils/pet.helpers";

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

    return (
        <article
            className={[
                "pet-card",
                pet.equipped ? "equipped" : "",
                selected ? "selected" : "",
            ].join(" ")}
            onClick={onSelect}
        >
            <div className={`pet-card-cover ${theme}`}>
                {pet.premium && (
                    <span className="premium-badge">
                        ★ {t("common:pet.premium")}
                    </span>
                )}

                {pet.equipped && (
                    <span className="equipped-badge">
                        ● {t("common:pet.equipped")}
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

                <div className="level-line">
                    <div
                        style={{
                            width: `${Math.min(pet.level * 4, 100)}%`,
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
                                ? `✓ ${t("common:pet.equipped")}`
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
                        ✎
                    </button>

                    <button
                        type="button"
                        className="icon-btn purple-icon"
                        disabled={loading}
                        onClick={(event) => {
                            event.stopPropagation();
                            onUpgrade();
                        }}
                        aria-label={t("common:pet.upgrade")}
                        title={t("common:pet.upgrade")}
                    >
                        ↗
                    </button>
                </div>
            </div>
        </article>
    );
}