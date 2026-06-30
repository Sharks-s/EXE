import { useEffect, useState } from "react";
import { petApi } from "../api/petApi";
import type { ShopPet } from "../types/pet.type";

export function usePetShop() {
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
      console.error(err);
      setError("Không thể tải danh sách thú cưng trong shop.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopPets();
  }, []);

  const handleAddPet = async (petId: number) => {
    try {
      setAddingId(petId);
      setError("");

      const addedPet = await petApi.addPet(petId);
      setShopPets((prev) => prev.filter((pet) => pet.id !== petId));
      return addedPet;
    } catch (err) {
      console.error(err);
      setError("Không thể thêm thú cưng này.");
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
