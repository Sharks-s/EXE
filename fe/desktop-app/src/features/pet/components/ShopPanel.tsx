import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ShopPet, UserPet } from "../types/pet.type";
import { usePetShop } from "../hooks/usePetShop";
import { PetAnimation } from "./PetAnimation";
import {
    formatPetCode,
    getPetEmoji,
    getPetTheme,
} from "../utils/pet.helpers";

type ShopPanelProps = {
    onPetAdded: (pet: UserPet) => void;
};

const PREVIEW_ACTIVITIES = ["working", "sleep", "angry", "remind", "question"];

const SHOP_TEXT = {
    preview: "Xem tr\u01b0\u1edbc",
    buy: "Mua",
    buying: "\u0110ang mua...",
    confirmTitle: "X\u00e1c nh\u1eadn mua",
    confirmMessage:
        "B\u1ea1n c\u00f3 ch\u1eafc mu\u1ed1n mua b\u1ea1n \u0111\u1ed3ng h\u00e0nh n\u00e0y kh\u00f4ng?",
    cancel: "H\u1ee7y",
    confirmBuy: "X\u00e1c nh\u1eadn mua",
    previewTitle: "Xem tr\u01b0\u1edbc chuy\u1ec3n \u0111\u1ed9ng",
    previewDescription:
        "Xem c\u00e1c tr\u1ea1ng th\u00e1i animation tr\u01b0\u1edbc khi quy\u1ebft \u0111\u1ecbnh mua.",
    close: "\u0110\u00f3ng",
    focusPoints: "Focus Points",
    price: "Gi\u00e1",
} as const;

export function ShopPanel({ onPetAdded }: ShopPanelProps) {
    const { t } = useTranslation();
    const [previewPet, setPreviewPet] = useState<ShopPet | null>(null);
    const [confirmPet, setConfirmPet] = useState<ShopPet | null>(null);

    const { shopPets, loading, addingId, error, handleAddPet } = usePetShop();

    const addPet = async (pet: ShopPet) => {
        const addedPet = await handleAddPet(pet.id);
        if (addedPet) onPetAdded(addedPet);
        setConfirmPet(null);
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
                            onPreview={() => setPreviewPet(pet)}
                            onAdd={() => setConfirmPet(pet)}
                        />
                    ))}
                </div>
            )}

            <ShopPetPreviewModal
                pet={previewPet}
                onClose={() => setPreviewPet(null)}
            />

            <ShopPurchaseConfirmModal
                adding={confirmPet ? addingId === confirmPet.id : false}
                pet={confirmPet}
                onClose={() => setConfirmPet(null)}
                onConfirm={() => confirmPet && addPet(confirmPet)}
            />
        </section>
    );
}

type ShopPetCardProps = {
    pet: ShopPet;
    adding: boolean;
    onPreview: () => void;
    onAdd: () => void;
};

function ShopPetCard({ pet, adding, onPreview, onAdd }: ShopPetCardProps) {
    const { t } = useTranslation();

    const theme = getPetTheme(pet.code);

    return (
        <article className="shop-pet-card">
            <div className={`shop-pet-cover ${theme}`}>
                {pet.premium && (
                    <span className="premium-badge">
                        {"\u2605"} {t("common:pet.premium")}
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
                    <span>{t("common:pet.price", { defaultValue: SHOP_TEXT.price })}</span>
                    <strong>
                        {t("common:pet.price_points", {
                            points: pet.price ?? 0,
                            defaultValue: "{{points}} Focus Points",
                        })}
                    </strong>
                </div>

                <button type="button" disabled={adding} onClick={onAdd}>
                    {adding ? t("common:pet.adding") : SHOP_TEXT.buy}
                </button>

                <button
                    type="button"
                    className="shop-preview-button"
                    onClick={onPreview}
                >
                    {SHOP_TEXT.preview}
                </button>
            </div>
        </article>
    );
}

type ShopPetPreviewModalProps = {
    pet: ShopPet | null;
    onClose: () => void;
};

function ShopPetPreviewModal({ pet, onClose }: ShopPetPreviewModalProps) {
    const { t } = useTranslation();

    if (!pet) return null;

    return (
        <div
            className="shop-modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <section className="shop-preview-modal" role="dialog" aria-modal="true">
                <div className="shop-modal-header">
                    <div>
                        <p>{SHOP_TEXT.previewTitle}</p>
                        <h2>{pet.name}</h2>
                        <span>{SHOP_TEXT.previewDescription}</span>
                    </div>
                    <button type="button" onClick={onClose} aria-label={SHOP_TEXT.close}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="shop-preview-grid">
                    {PREVIEW_ACTIVITIES.map((activity) => (
                        <article className="shop-preview-item" key={activity}>
                            <div className="shop-preview-animation">
                                <PetAnimation code={pet.code} activity={activity} />
                            </div>
                            <strong>
                                {t(`common:pet.activity.${activity}`, {
                                    defaultValue: activity,
                                })}
                            </strong>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
}

type ShopPurchaseConfirmModalProps = {
    adding: boolean;
    pet: ShopPet | null;
    onClose: () => void;
    onConfirm: () => void;
};

function ShopPurchaseConfirmModal({
    adding,
    pet,
    onClose,
    onConfirm,
}: ShopPurchaseConfirmModalProps) {
    if (!pet) return null;

    return (
        <div
            className="shop-modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !adding) onClose();
            }}
        >
            <section className="shop-confirm-modal" role="dialog" aria-modal="true">
                <div className="shop-confirm-pet">
                    <div className={`shop-confirm-image ${getPetTheme(pet.code)}`}>
                        <PetAnimation code={pet.code} activity="working" fps={8} />
                    </div>
                    <div>
                        <p>{SHOP_TEXT.confirmTitle}</p>
                        <h2>{pet.name}</h2>
                        <span>{formatPetCode(pet.code)}</span>
                    </div>
                </div>

                <p className="shop-confirm-message">{SHOP_TEXT.confirmMessage}</p>

                <div className="shop-confirm-price">
                    <span>{SHOP_TEXT.buy}</span>
                    <strong>
                        {pet.price ?? 0} {SHOP_TEXT.focusPoints}
                    </strong>
                </div>

                <div className="shop-confirm-actions">
                    <button type="button" onClick={onClose} disabled={adding}>
                        {SHOP_TEXT.cancel}
                    </button>
                    <button type="button" onClick={onConfirm} disabled={adding}>
                        {adding ? SHOP_TEXT.buying : SHOP_TEXT.confirmBuy}
                    </button>
                </div>
            </section>
        </div>
    );
}
