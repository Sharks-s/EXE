import { useEffect, useMemo, useState } from "react";
import { petApi } from "../api/petApi";
import type { UserPet } from "../types/pet.type";

export function useUserPets() {
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
      setPets(data);

      const equippedPet = data.find((pet) => pet.equipped);
      setSelectedPet(equippedPet ?? data[0] ?? null);
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách bạn đồng hành.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  const equippedPet = useMemo(() => {
    return pets.find((pet) => pet.equipped) ?? null;
  }, [pets]);

  const premiumCount = useMemo(() => {
    return pets.filter((pet) => pet.premium).length;
  }, [pets]);

  const addPetToCollection = (addedPet: UserPet) => {
    setPets((prev) => {
      if (prev.some((pet) => pet.userPetId === addedPet.userPetId)) {
        return prev;
      }

      return [addedPet, ...prev];
    });

    setSelectedPet((prev) => prev ?? addedPet);
  };

  const handleEquip = async (userPetId: number) => {
    try {
      setActionLoadingId(userPetId);
      setError("");

      const updatedPet = await petApi.equipPet(userPetId);

      setPets((prev) =>
        prev.map((pet) => ({
          ...pet,
          equipped: pet.userPetId === updatedPet.userPetId,
        })),
      );

      setSelectedPet({
        ...updatedPet,
        equipped: true,
      });
    } catch (err) {
      console.error(err);
      setError("Không thể trang bị bạn đồng hành.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRename = async (userPetId: number, newName: string) => {
    const nextName = newName.trim();
    if (!nextName) return false;

    try {
      setActionLoadingId(userPetId);
      setError("");

      const updatedPet = await petApi.renamePet(userPetId, nextName);

      setPets((prev) =>
        prev.map((pet) =>
          pet.userPetId === userPetId ? { ...pet, ...updatedPet } : pet,
        ),
      );

      setSelectedPet((prev) =>
        prev?.userPetId === userPetId ? { ...prev, ...updatedPet } : prev,
      );
      return true;
    } catch (err) {
      console.error(err);
      setError("Không thể đổi tên bạn đồng hành.");
      return false;
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpgrade = async (userPetId: number) => {
    try {
      setActionLoadingId(userPetId);
      setError("");

      const updatedPet = await petApi.upgradePet(userPetId);

      setPets((prev) =>
        prev.map((pet) =>
          pet.userPetId === userPetId ? { ...pet, ...updatedPet } : pet,
        ),
      );

      setSelectedPet((prev) =>
        prev?.userPetId === userPetId ? { ...prev, ...updatedPet } : prev,
      );
    } catch (err) {
      console.error(err);
      setError("Không thể nâng cấp bạn đồng hành.");
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
