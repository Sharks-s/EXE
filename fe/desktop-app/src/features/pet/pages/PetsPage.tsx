import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUserPets } from "../hooks/useUserPets";
import type { UserPet } from "../types/pet.type";
import "./PetsPage.css";

// Import các Component con đã được tách ra file riêng
import { PetHeader } from "../components/PetHeader";
import { PetNavbar } from "../components/PetNavbar";
import { PetStats } from "../components/PetStats";
import { PetToolbar } from "../components/PetToolbar";
import { PetCard } from "../components/PetCard";
import { PetDetail } from "../components/PetDetail";
import { RenamePetModal } from "../components/RenamePetModal";
import { ShopPanel } from "../components/ShopPanel";

type PetTab = "my-pets" | "shop";
type FilterType = "all" | "equipped" | "premium" | "normal";
type SortType = "level-desc" | "level-asc";

export default function PetsPage() {
  const { t } = useTranslation("common");
  const {
    pets,
    selectedPet,
    setSelectedPet,
    equippedPet,
    premiumCount,
    loading,
    error,
    actionLoadingId,
    addPetToCollection,
    handleEquip,
    handleRename,
    handleUpgrade,
  } = useUserPets();

  const [activeTab, setActiveTab] = useState<PetTab>("my-pets");
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("level-desc");

  // State Modal Đổi tên (Chỉ cần lưu Pet nào đang được chọn)
  const [renamePet, setRenamePet] = useState<UserPet | null>(null);

  const openRenameModal = (pet: UserPet) => setRenamePet(pet);

  const closeRenameModal = () => {
    if (renamePet && actionLoadingId === renamePet.userPetId) return;
    setRenamePet(null);
  };

  const submitRename = async (newName: string) => {
    if (!renamePet) return;
    const renamed = await handleRename(renamePet.userPetId, newName);
    if (renamed) closeRenameModal();
  };

  const filteredPets = useMemo(() => {
    let result = [...pets];

    if (keyword.trim()) {
      const lowerKeyword = keyword.toLowerCase();
      result = result.filter(
        (pet) =>
          pet.customName.toLowerCase().includes(lowerKeyword) ||
          pet.code.toLowerCase().includes(lowerKeyword) ||
          String(pet.userPetId).includes(lowerKeyword)
      );
    }

    if (filter === "equipped") result = result.filter((pet) => pet.equipped);
    if (filter === "premium") result = result.filter((pet) => pet.premium);
    if (filter === "normal") result = result.filter((pet) => !pet.premium);

    result.sort((a, b) => (sort === "level-desc" ? b.level - a.level : a.level - b.level));

    return result;
  }, [pets, keyword, filter, sort]);

  return (
    <div className="pet-page">
      <section className="pet-shell">
        <PetHeader />

        <PetNavbar activeTab={activeTab} onChangeTab={setActiveTab} />

        {activeTab === "my-pets" ? (
          <>
            <PetStats
              totalPets={pets.length}
              equippedPet={equippedPet}
              premiumCount={premiumCount}
            />

            <PetToolbar
              keyword={keyword}
              filter={filter}
              sort={sort}
              onKeywordChange={setKeyword}
              onFilterChange={setFilter}
              onSortChange={setSort}
            />

            {/* Error hiển thị dạng Inline (từ hàm fetchPets có silent: true) */}
            {error && <div className="pet-error">{error}</div>}

            {loading ? (
              <div className="pet-loading">
                {t("pet.loading_pets", { defaultValue: "Đang tải danh sách bạn đồng hành..." })}
              </div>
            ) : (
              <div className="pet-content">
                <div className="pet-grid">
                  {filteredPets.length > 0 ? (
                    filteredPets.map((pet) => (
                      <PetCard
                        key={pet.userPetId}
                        pet={pet}
                        selected={selectedPet?.userPetId === pet.userPetId}
                        loading={actionLoadingId === pet.userPetId}
                        onSelect={() => setSelectedPet(pet)}
                        onEquip={() => handleEquip(pet.userPetId)}
                        onRename={() => openRenameModal(pet)}
                        onUpgrade={() => handleUpgrade(pet.userPetId)}
                      />
                    ))
                  ) : (
                    <div className="pet-empty">
                      {t("pet.not_found", { defaultValue: "Không tìm thấy bạn đồng hành phù hợp." })}
                    </div>
                  )}
                </div>

                <PetDetail
                  pet={selectedPet}
                  loading={selectedPet?.userPetId === actionLoadingId}
                  onClose={() => setSelectedPet(null)}
                  onRename={() => selectedPet && openRenameModal(selectedPet)}
                  onUpgrade={() => selectedPet && handleUpgrade(selectedPet.userPetId)}
                />
              </div>
            )}
          </>
        ) : (
          <ShopPanel onPetAdded={addPetToCollection} />
        )}
      </section>

      {/* Gọi Modal Đổi tên (Đã tự lo phần Form bên trong) */}
      <RenamePetModal
        pet={renamePet}
        loading={renamePet?.userPetId === actionLoadingId}
        onClose={closeRenameModal}
        onSubmit={submitRename}
      />
    </div>
  );
}
