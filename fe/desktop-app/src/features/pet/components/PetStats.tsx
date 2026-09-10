import { useTranslation } from "react-i18next";
import type { UserPet } from "../types/pet.type";

type PetStatsProps = {
    totalPets: number;
    equippedPet: UserPet | null;
    premiumCount: number;
};

export function PetStats({
    totalPets,
    equippedPet,
    premiumCount,
}: PetStatsProps) {
    const { t } = useTranslation("common");

    return (
        <section className="pet-stats">
            <div className="pet-stat-card">
                <div className="stat-icon purple">🐾</div>
                <div>
                    <strong>{totalPets}</strong>
                    <span>{t("common:pet.total_companions")}</span>
                </div>
            </div>

            <div className="pet-stat-card">
                <div className="stat-icon green">🛡</div>
                <div>
                    <strong>{equippedPet?.code ?? t("common:pet.none")}</strong>
                    <span>{t("common:pet.equipped")}</span>

                    {equippedPet && (
                        <small>
                            {t("common:pet.level", {
                                level: equippedPet.level,
                            })}
                        </small>
                    )}
                </div>
            </div>

            <div className="pet-stat-card">
                <div className="stat-icon orange">☆</div>
                <div>
                    <strong>{premiumCount}</strong>
                    <span>{t("common:pet.premium_companions")}</span>

                    <small>
                        {t("common:pet.premium_count", {
                            premium: premiumCount,
                            total: totalPets,
                        })}
                    </small>
                </div>
            </div>
        </section>
    );
}