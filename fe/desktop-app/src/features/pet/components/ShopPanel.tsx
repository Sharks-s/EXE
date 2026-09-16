import { useTranslation } from "react-i18next";
import type { ShopPet, UserPet } from "../types/pet.type";
import { usePetShop } from "../hooks/usePetShop";
import {
    formatPetCode,
    getPetEmoji,
    getPetTheme,
} from "../utils/pet.helpers";

type ShopPanelProps = {
    onPetAdded: (pet: UserPet) => void;
};

export function ShopPanel({ onPetAdded }: ShopPanelProps) {
    const { t } = useTranslation();

    const { shopPets, loading, addingId, error, handleAddPet } = usePetShop();

    const addPet = async (petId: number) => {
        const addedPet = await handleAddPet(petId);
        if (addedPet) onPetAdded(addedPet);
    };

    if (loading) {
        return (
            <div className="pet-loading">
                {t("common:pet.shop_loading")}
            </div>
        );
    }

    return (
        <section className="shop-panel">
            {error && <div className="pet-error">{error}</div>}

            <div className="shop-header">
                <div>
                    <h2>{t("common:pet.shop_title")}</h2>
                    <p>{t("common:pet.shop_description")}</p>
                </div>
            </div>

            {shopPets.length === 0 ? (
                <div className="pet-empty">
                    {t("common:pet.shop_empty")}
                </div>
            ) : (
                <div className="shop-grid">
                    {shopPets.map((pet) => (
                        <ShopPetCard
                            key={pet.id}
                            pet={pet}
                            adding={addingId === pet.id}
                            onAdd={() => addPet(pet.id)}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

type ShopPetCardProps = {
    pet: ShopPet;
    adding: boolean;
    onAdd: () => void;
};

function ShopPetCard({ pet, adding, onAdd }: ShopPetCardProps) {
    const { t } = useTranslation();

    const theme = getPetTheme(pet.code);

    return (
        <article className="shop-pet-card">
            <div className={`shop-pet-cover ${theme}`}>
                {pet.premium && (
                    <span className="premium-badge">
                        ★ {t("common:pet.premium")}
                    </span>
                )}

                <div className="pet-image-box">
                    {pet.imageUrl ? (
                        <img src={pet.imageUrl} alt={pet.name} />
                    ) : (
                        <span>{getPetEmoji(pet.code)}</span>
                    )}
                </div>
            </div>

            <div className="shop-pet-body">
                <h3>{pet.name}</h3>
                <p>{formatPetCode(pet.code)}</p>

                <span className="shop-description">
                    {pet.description || t("common:pet.no_description")}
                </span>

                <div className="shop-meta">
                    <span>{t("common:pet.type")}</span>
                    <strong>
                        {pet.premium
                            ? t("common:pet.premium")
                            : t("common:pet.normal")}
                    </strong>
                </div>

                <div className="shop-price">
                    <span>{t("common:pet.price", { defaultValue: "Giá" })}</span>
                    <strong>
                        {t("common:pet.price_points", {
                            points: pet.price ?? 0,
                            defaultValue: "{{points}} Focus Points",
                        })}
                    </strong>
                </div>

                <button
                    type="button"
                    disabled={adding}
                    onClick={onAdd}
                >
                    {adding
                        ? t("common:pet.adding")
                        : t("common:pet.add_now")}
                </button>
            </div>
        </article>
    );
}
