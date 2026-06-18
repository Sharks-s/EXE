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
      setError("Không thể tải danh sách thú cưng.");
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

  const handleEquip = async (userPetId: number) => {
    try {
      setActionLoadingId(userPetId);
      setError("");

      const updatedPet = await petApi.equipPet(userPetId);

      setPets((prev) =>
        prev.map((pet) => ({
          ...pet,
          equipped: pet.userPetId === updatedPet.userPetId,
        }))
      );

      setSelectedPet({
        ...updatedPet,
        equipped: true,
      });
    } catch (err) {
      console.error(err);
      setError("Không thể trang bị thú cưng.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRename = async (userPetId: number, currentName: string) => {
    const newName = window.prompt("Nhập tên mới cho thú cưng:", currentName);

    if (!newName || newName.trim() === "") return;

    try {
      setActionLoadingId(userPetId);
      setError("");

      const updatedPet = await petApi.renamePet(userPetId, newName.trim());

      setPets((prev) =>
        prev.map((pet) =>
          pet.userPetId === userPetId ? { ...pet, ...updatedPet } : pet
        )
      );

      setSelectedPet((prev) =>
        prev?.userPetId === userPetId ? { ...prev, ...updatedPet } : prev
      );
    } catch (err) {
      console.error(err);
      setError("Không thể đổi tên thú cưng.");
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
          pet.userPetId === userPetId ? { ...pet, ...updatedPet } : pet
        )
      );

      setSelectedPet((prev) =>
        prev?.userPetId === userPetId ? { ...prev, ...updatedPet } : prev
      );
    } catch (err) {
      console.error(err);
      setError("Không thể nâng cấp thú cưng.");
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
    handleEquip,
    handleRename,
    handleUpgrade,
  };
}