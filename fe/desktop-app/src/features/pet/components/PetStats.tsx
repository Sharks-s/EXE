import { useTranslation } from "react-i18next";
import type { UserPet } from "../types/pet.type";

type PetStatsProps = {
    totalPets: number;
    equippedPet: UserPet | null;
    premiumCount: number;
    currentPoints?: number | null;
};

export function PetStats({
    totalPets,
    equippedPet,
    premiumCount,
    currentPoints,
}: PetStatsProps) {
    const { t } = useTranslation("common");

    return (
        <section className="pet-stats">
            <div className="pet-stat-card stat-purple">
                <div className="stat-icon purple">
                    <span className="material-symbols-outlined icon-fill">pets</span>
                </div>
                <div>
                    <strong>{totalPets}</strong>
                    <span>{t("common:pet.total_companions")}</span>
                </div>
            </div>

            <div className="pet-stat-card stat-green">
                <div className="stat-icon green">
                    <span className="material-symbols-outlined icon-fill">verified</span>
                </div>
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

            <div className="pet-stat-card stat-orange">
                <div className="stat-icon orange">
                    <span className="material-symbols-outlined icon-fill">stars</span>
                </div>
                <div>
                    <strong>{currentPoints ?? 0}</strong>
                    <span>{t("common:pet.focus_points", { defaultValue: "Focus Points" })}</span>

                    <small>
                        {t("common:pet.point_balance", {
                            defaultValue: "Số dư hiện tại",
                        })}
                    </small>
                </div>
            </div>

            <div className="pet-stat-card stat-blue">
                <div className="stat-icon blue">
                    <span className="material-symbols-outlined icon-fill">workspace_premium</span>
                </div>
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
