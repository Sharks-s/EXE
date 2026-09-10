import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { RenamePetSchema } from "../schemas/petName.schemas";
import type { UserPet } from "../types/pet.type";
import { formatPetCode, getPetEmoji, getPetTheme } from "../utils/pet.helpers";

type FormData = z.infer<typeof RenamePetSchema>;

type RenamePetModalProps = {
    pet: UserPet | null;
    loading: boolean;
    onClose: () => void;
    onSubmit: (petName: string) => Promise<void>;
};

export function RenamePetModal({ pet, loading, onClose, onSubmit }: RenamePetModalProps) {
    // Ưu tiên file common làm mặc định, validationErrors dùng khi cần báo lỗi Zod
    const { t } = useTranslation(["common", "validationErrors"]);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(RenamePetSchema),
        mode: "onChange",
        defaultValues: { petName: "" }, // Đổi name thành petName
    });

    // Tự động điền tên cũ vào input khi mở Modal
    useEffect(() => {
        if (pet) {
            reset({ petName: pet.customName }); // Đổi name thành petName
        }
    }, [pet, reset]);

    if (!pet) return null;

    const theme = getPetTheme(pet.code);

    const handleFormSubmit = async (data: FormData) => {
        await onSubmit(data.petName); // Đổi data.name thành data.petName
    };

    return (
        <div
            className="rename-modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <form className="rename-modal" onSubmit={handleSubmit(handleFormSubmit)}>
                <button
                    className="rename-modal-close"
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    aria-label={t("pet.btn_close", { defaultValue: "Đóng" })}
                >
                    ×
                </button>

                <div className={`rename-modal-avatar ${theme}`}>
                    {pet.imageUrl ? (
                        <img src={pet.imageUrl} alt={pet.customName} />
                    ) : (
                        <span>{getPetEmoji(pet.code)}</span>
                    )}
                </div>

                <div className="rename-modal-heading">
                    <p>{t("pet.rename_title", { defaultValue: "Đổi tên bạn đồng hành" })}</p>
                    <h2>{formatPetCode(pet.code)}</h2>
                </div>

                <label className="rename-modal-field">
                    <span>{t("pet.new_name", { defaultValue: "Tên mới" })}</span>
                    <input
                        autoFocus
                        disabled={loading}
                        placeholder={t("pet.name_placeholder", { defaultValue: "Nhập tên bạn đồng hành" })}
                        {...register("petName")} // Đổi name thành petName
                    />
                </label>

                {/* Validate từ Zod -> Dịch qua i18n */}
                {errors.petName?.message && (
                    <div className="rename-modal-error text-red-500 text-xs mt-1">
                        {t(`validationErrors:petName.${errors.petName.message}`, {
                            max: 32,
                            defaultValue: "Tên không hợp lệ"
                        })}
                    </div>
                )}

                <div className="rename-modal-actions">
                    <button type="button" onClick={onClose} disabled={loading}>
                        {t("pet.btn_cancel", { defaultValue: "Hủy" })}
                    </button>
                    <button type="submit" disabled={loading}>
                        {loading
                            ? t("pet.saving", { defaultValue: "Đang lưu..." })
                            : t("pet.btn_save", { defaultValue: "Lưu tên" })}
                    </button>
                </div>
            </form>
        </div>
    );
}