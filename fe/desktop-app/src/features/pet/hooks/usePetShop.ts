import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { petApi } from "../api/petApi";
import { handleApiError } from "@/utils/handleApiError";
import type { ShopPet } from "../types/pet.type";

const LOG_CONTEXT = "[usePetShop]";

export function usePetShop() {
  const { t } = useTranslation(["businessErrors", "common"]);
  const [shopPets, setShopPets] = useState<ShopPet[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const fetchShopPets = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await petApi.getShopPets();
      setShopPets(data);
    } catch (err) {
      // Dùng silent: true để tự render lỗi ra giao diện thay vì bắn Toast
      const msg = handleApiError(err, {
        context: LOG_CONTEXT,
        action: "Tải danh sách shop",
        silent: true,
        fallbackMessage: t("businessErrors:SYS_001", { defaultValue: "Lỗi hệ thống, vui lòng thử lại sau" }),
      });
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopPets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddPet = async (petId: number) => {
    try {
      setAddingId(petId);
      setError("");
      const addedPet = await petApi.addPet(petId);
      setShopPets((prev) => prev.filter((pet) => pet.id !== petId));
      return addedPet;
    } catch (err) {
      // Bắn Toast cho thao tác tương tác trực tiếp
      handleApiError(err, {
        context: LOG_CONTEXT,
        action: "Thêm bạn đồng hành",
        fallbackMessage: t("businessErrors:SYS_001", { defaultValue: "Lỗi hệ thống, vui lòng thử lại sau" }),
      });
      return null;
    } finally {
      setAddingId(null);
    }
  };

  return {
    shopPets,
    loading,
    addingId,
    error,
    fetchShopPets,
    handleAddPet,
  };
}