import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { petApi } from "../api/petApi";
import { handleApiError } from "@/utils/handleApiError";
import type { UserPet } from "../types/pet.type";
import {
  XP_PER_PET_LEVEL,
  canUpgradePet,
  getPetExperience,
} from "../utils/petExperience";

const LOG_CONTEXT = "[useUserPets]";

const withDefaultExperience = (pet: UserPet): UserPet => ({
  ...pet,
  experience: pet.experience ?? 0,
});

const hydratePetExperience = async (pets: UserPet[]) => {
  const detailsResults = await Promise.allSettled(
    pets.map((pet) => petApi.getPetDetails(pet.userPetId)),
  );

  return pets.map((pet, index) => {
    const detailsResult = detailsResults[index];
    if (detailsResult?.status !== "fulfilled") {
      return withDefaultExperience(pet);
    }

    return {
      ...pet,
      ...detailsResult.value,
      premium: pet.premium,
      equipped: pet.equipped,
    };
  });
};

const mergeUpgradedPet = (pet: UserPet, updatedPet: UserPet): UserPet => {
  const fallbackExperience = Math.max(
    getPetExperience(pet) - XP_PER_PET_LEVEL,
    0,
  );

  return {
    ...pet,
    ...updatedPet,
    level: updatedPet.level ?? pet.level + 1,
    experience: updatedPet.experience ?? fallbackExperience,
  };
};

export function useUserPets() {
  const { t } = useTranslation(["businessErrors", "common"]);
  const [pets, setPets] = useState<UserPet[]>([]);
  const [selectedPet, setSelectedPet] = useState<UserPet | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const fetchPets = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await petApi.getMyPets();
      const petsWithExperience = await hydratePetExperience(data);
      setPets(petsWithExperience);
    } catch (err) {
      const msg = handleApiError(err, {
        context: LOG_CONTEXT,
        action: "Tải thú cưng của user",
        silent: true,
        fallbackMessage: t("businessErrors:SYS_001", { defaultValue: "Lỗi hệ thống, vui lòng thử lại sau" }),
      });
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const equippedPet = useMemo(() => pets.find((pet) => pet.equipped) ?? null, [pets]);
  const premiumCount = useMemo(() => pets.filter((pet) => pet.premium).length, [pets]);

  const addPetToCollection = (addedPet: UserPet) => {
    setPets((prev) => {
      if (prev.some((pet) => pet.userPetId === addedPet.userPetId)) return prev;
      return [addedPet, ...prev];
    });
    setSelectedPet((prev) => prev ?? addedPet);
  };

  const handleEquip = async (userPetId: number) => {
    try {
      setActionLoadingId(userPetId);
      const updatedPet = await petApi.equipPet(userPetId);

      setPets((prev) =>
        prev.map((pet) => ({
          ...pet,
          equipped: pet.userPetId === updatedPet.userPetId,
        }))
      );
      setSelectedPet((prev) => ({
        ...(pets.find((pet) => pet.userPetId === updatedPet.userPetId) ?? prev ?? updatedPet),
        ...updatedPet,
        equipped: true,
      }));
    } catch (err) {
      handleApiError(err, {
        context: LOG_CONTEXT,
        action: "Trang bị thú cưng",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRename = async (userPetId: number, newName: string) => {
    const nextName = newName.trim();
    if (!nextName) return false;

    try {
      setActionLoadingId(userPetId);
      const updatedPet = await petApi.renamePet(userPetId, nextName);

      setPets((prev) => prev.map((pet) => (pet.userPetId === userPetId ? { ...pet, ...updatedPet } : pet)));
      setSelectedPet((prev) => (prev?.userPetId === userPetId ? { ...prev, ...updatedPet } : prev));
      return true;
    } catch (err) {
      handleApiError(err, {
        context: LOG_CONTEXT,
        action: "Đổi tên thú cưng",
      });
      return false;
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpgrade = async (userPetId: number) => {
    const targetPet = pets.find((pet) => pet.userPetId === userPetId);
    if (!targetPet || !canUpgradePet(targetPet)) return;

    try {
      setActionLoadingId(userPetId);
      const updatedPet = await petApi.upgradePet(userPetId);

      setPets((prev) =>
        prev.map((pet) =>
          pet.userPetId === userPetId ? mergeUpgradedPet(pet, updatedPet) : pet,
        ),
      );
      setSelectedPet((prev) =>
        prev?.userPetId === userPetId ? mergeUpgradedPet(prev, updatedPet) : prev,
      );
    } catch (err) {
      handleApiError(err, {
        context: LOG_CONTEXT,
        action: "Nâng cấp thú cưng",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  return {
    pets,
    selectedPet,
    setSelectedPet,
    equippedPet,
    premiumCount,
    loading,
    error,
    actionLoadingId,
    fetchPets,
    addPetToCollection,
    handleEquip,
    handleRename,
    handleUpgrade,
  };
}
