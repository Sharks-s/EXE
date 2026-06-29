import { type FormEvent, useMemo, useState } from "react";
import { useUserPets } from "../hooks/useUserPets";
import type { UserPet, ShopPet } from "../types/pet.type";
import { usePetShop } from "../hooks/usePetShop";

import "./PetsPage.css";

type PetTab = "my-pets" | "shop";
type FilterType = "all" | "equipped" | "premium" | "normal";
type SortType = "level-desc" | "level-asc";

export default function PetsPage() {
  const {
    pets,
    selectedPet,
    setSelectedPet,
    equippedPet,
    premiumCount,
    loading,
    error,
    actionLoadingId,
    handleEquip,
    handleRename,
    handleUpgrade,
  } = useUserPets();

  const [activeTab, setActiveTab] = useState<PetTab>("my-pets");
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("level-desc");
  const [renamePet, setRenamePet] = useState<UserPet | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState("");

  const openRenameModal = (pet: UserPet) => {
    setRenamePet(pet);
    setRenameValue(pet.customName);
    setRenameError("");
  };

  const closeRenameModal = () => {
    if (renamePet && actionLoadingId === renamePet.userPetId) return;
    setRenamePet(null);
    setRenameValue("");
    setRenameError("");
  };

  const submitRename = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!renamePet) return;

    const nextName = renameValue.trim();
    if (!nextName) {
      setRenameError("Tên thú cưng không được để trống.");
      return;
    }

    const renamed = await handleRename(renamePet.userPetId, nextName);
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

    if (filter === "equipped") {
      result = result.filter((pet) => pet.equipped);
    }

    if (filter === "premium") {
      result = result.filter((pet) => pet.premium);
    }

    if (filter === "normal") {
      result = result.filter((pet) => !pet.premium);
    }

    result.sort((a, b) => {
      if (sort === "level-desc") return b.level - a.level;
      return a.level - b.level;
    });

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

            {error && <div className="pet-error">{error}</div>}

            {loading ? (
              <div className="pet-loading">Đang tải danh sách thú cưng...</div>
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
                      Không tìm thấy thú cưng phù hợp.
                    </div>
                  )}
                </div>

                <PetDetail
                  pet={selectedPet}
                  loading={selectedPet?.userPetId === actionLoadingId}
                  onClose={() => setSelectedPet(null)}
                  onRename={() => {
                    if (!selectedPet) return;
                    openRenameModal(selectedPet);
                  }}
                  onUpgrade={() => {
                    if (!selectedPet) return;
                    handleUpgrade(selectedPet.userPetId);
                  }}
                />
              </div>
            )}
          </>
        ) : (
          <ShopPanel />
        )}
      </section>

      <RenamePetModal
        pet={renamePet}
        value={renameValue}
        error={renameError}
        loading={renamePet?.userPetId === actionLoadingId}
        onChange={(value) => {
          setRenameValue(value);
          if (renameError) setRenameError("");
        }}
        onClose={closeRenameModal}
        onSubmit={submitRename}
      />
    </div>
  );
}

function PetHeader() {
  return (
    <header className="pet-header app-page-header">
      <div className="pet-title-wrap app-page-title">
        <div className="app-page-title-row">
          <span className="app-page-title-icon">
            <span className="material-symbols-outlined">pets</span>
          </span>
          <h1>Thú cưng của tôi</h1>
        </div>
        <p>Quản lý, trang bị và nâng cấp thú cưng đồng hành.</p>
      </div>

    </header>
  );
}

type PetNavbarProps = {
  activeTab: PetTab;
  onChangeTab: (tab: PetTab) => void;
};

function PetNavbar({ activeTab, onChangeTab }: PetNavbarProps) {
  return (
    <nav className="pet-navbar">
      <button
        type="button"
        className={activeTab === "my-pets" ? "active" : ""}
        onClick={() => onChangeTab("my-pets")}
      >
        🐾 My Pets
      </button>

      <button
        type="button"
        className={activeTab === "shop" ? "active" : ""}
        onClick={() => onChangeTab("shop")}
      >
        🛒 Shop
      </button>
    </nav>
  );
}

type PetStatsProps = {
  totalPets: number;
  equippedPet: UserPet | null;
  premiumCount: number;
};

function PetStats({ totalPets, equippedPet, premiumCount }: PetStatsProps) {
  return (
    <section className="pet-stats">
      <div className="pet-stat-card">
        <div className="stat-icon purple">🐾</div>
        <div>
          <strong>{totalPets}</strong>
          <span>Tổng số thú cưng</span>
        </div>
      </div>

      <div className="pet-stat-card">
        <div className="stat-icon green">🛡</div>
        <div>
          <strong>{equippedPet?.code ?? "Chưa có"}</strong>
          <span>Đang trang bị</span>
          {equippedPet && <small>Cấp {equippedPet.level}</small>}
        </div>
      </div>

      <div className="pet-stat-card">
        <div className="stat-icon orange">☆</div>
        <div>
          <strong>{premiumCount}</strong>
          <span>Thú cưng cao cấp</span>
          <small>
            {premiumCount} / {totalPets} cao cấp
          </small>
        </div>
      </div>
    </section>
  );
}

type PetToolbarProps = {
  keyword: string;
  filter: FilterType;
  sort: SortType;
  onKeywordChange: (value: string) => void;
  onFilterChange: (value: FilterType) => void;
  onSortChange: (value: SortType) => void;
};

function PetToolbar({
  keyword,
  filter,
  sort,
  onKeywordChange,
  onFilterChange,
  onSortChange,
}: PetToolbarProps) {
  return (
    <section className="pet-toolbar">
      <div className="pet-search">
        <span>⌕</span>
        <input
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder="Tìm kiếm theo tên hoặc mã..."
        />
      </div>

      <select
        value={filter}
        onChange={(event) => onFilterChange(event.target.value as FilterType)}
      >
        <option value="all">Tất cả</option>
        <option value="equipped">Đang trang bị</option>
        <option value="premium">Cao cấp</option>
        <option value="normal">Thường</option>
      </select>

      <select
        value={sort}
        onChange={(event) => onSortChange(event.target.value as SortType)}
      >
        <option value="level-desc">Cấp độ: Cao → Thấp</option>
        <option value="level-asc">Cấp độ: Thấp → Cao</option>
      </select>
    </section>
  );
}

type PetCardProps = {
  pet: UserPet;
  selected: boolean;
  loading: boolean;
  onSelect: () => void;
  onEquip: () => void;
  onRename: () => void;
  onUpgrade: () => void;
};

function PetCard({
  pet,
  selected,
  loading,
  onSelect,
  onEquip,
  onRename,
  onUpgrade,
}: PetCardProps) {
  const theme = getPetTheme(pet.code);

  return (
    <article
      className={[
        "pet-card",
        pet.equipped ? "equipped" : "",
        selected ? "selected" : "",
      ].join(" ")}
      onClick={onSelect}
    >
      <div className={`pet-card-cover ${theme}`}>
        {pet.premium && <span className="premium-badge">★ Cao cấp</span>}
        {pet.equipped && <span className="equipped-badge">● Đang trang bị</span>}

        <span className="level-badge">Cấp {pet.level}</span>

        <div className="pet-image-box">
          {pet.imageUrl ? (
            <img src={pet.imageUrl} alt={pet.customName} />
          ) : (
            <span>{getPetEmoji(pet.code)}</span>
          )}
        </div>
      </div>

      <div className="pet-card-body">
        <h3>{pet.customName}</h3>
        <p>{formatPetCode(pet.code)}</p>

        <div className="level-line">
          <div style={{ width: `${Math.min(pet.level * 4, 100)}%` }} />
        </div>


        <div className="pet-card-actions">
          <button
            type="button"
            className={pet.equipped ? "equip-btn equipped-btn" : "equip-btn"}
            disabled={pet.equipped || loading}
            onClick={(event) => {
              event.stopPropagation();
              onEquip();
            }}
          >
            {loading ? "Đang xử lý..." : pet.equipped ? "✓ Đang trang bị" : "Trang bị"}
          </button>

          <button
            type="button"
            className="icon-btn"
            disabled={loading}
            onClick={(event) => {
              event.stopPropagation();
              onRename();
            }}
          >
            ✎
          </button>

          <button
            type="button"
            className="icon-btn purple-icon"
            disabled={loading}
            onClick={(event) => {
              event.stopPropagation();
              onUpgrade();
            }}
          >
            ↗
          </button>
        </div>
      </div>
    </article>
  );
}

type PetDetailProps = {
  pet: UserPet | null;
  loading: boolean;
  onClose: () => void;
  onRename: () => void;
  onUpgrade: () => void;
};

function PetDetail({
  pet,
  loading,
  onClose,
  onRename,
  onUpgrade,
}: PetDetailProps) {
  if (!pet) {
    return (
      <aside className="pet-detail empty-detail">
        <p>Chọn một thú cưng để xem chi tiết.</p>
      </aside>
    );
  }

  const theme = getPetTheme(pet.code);

  return (
    <aside className="pet-detail">
      <button className="close-detail" type="button" onClick={onClose}>
        ×
      </button>

      <div className={`detail-image ${theme}`}>
        {pet.imageUrl ? (
          <img src={pet.imageUrl} alt={pet.customName} />
        ) : (
          <span>{getPetEmoji(pet.code)}</span>
        )}
      </div>

      <div className="detail-name">
        <h2>{pet.customName}</h2>
        <p>{formatPetCode(pet.code)}</p>
      </div>

      <div className="detail-level-box">
        <div className="detail-level-header">
          <span>Cấp độ</span>
          <strong>{pet.level} / 25</strong>
        </div>

        <div className="detail-level-line">
          <div style={{ width: `${Math.min((pet.level / 25) * 100, 100)}%` }} />
        </div>

        <small>{Math.max(25 - pet.level, 0)} cấp để đạt tối đa</small>
      </div>

      <div className="detail-info">


        <div>
          <span>Trạng thái</span>
          <strong className={pet.equipped ? "green-text" : ""}>
            {pet.equipped ? "Đang trang bị" : "Chưa trang bị"}
          </strong>
        </div>

        <div>
          <span>Loại</span>
          <strong>{pet.premium ? "Cao cấp" : "Thường"}</strong>
        </div>
      </div>

      {pet.equipped && (
        <div className="equipped-panel">🛡 Đang được trang bị</div>
      )}

      <div className="detail-actions">
        <button type="button" disabled={loading} onClick={onRename}>
          ✎ Đổi tên
        </button>

        <button type="button" disabled={loading} onClick={onUpgrade}>
          ↗ Nâng cấp
        </button>
      </div>
    </aside>
  );
}

type RenamePetModalProps = {
  pet: UserPet | null;
  value: string;
  error: string;
  loading: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function RenamePetModal({
  pet,
  value,
  error,
  loading,
  onChange,
  onClose,
  onSubmit,
}: RenamePetModalProps) {
  if (!pet) return null;

  const theme = getPetTheme(pet.code);

  return (
    <div
      className="rename-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form className="rename-modal" onSubmit={onSubmit}>
        <button
          className="rename-modal-close"
          type="button"
          onClick={onClose}
          disabled={loading}
          aria-label="Đóng"
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
          <p>Đổi tên thú cưng</p>
          <h2>{formatPetCode(pet.code)}</h2>
        </div>

        <label className="rename-modal-field">
          <span>Tên mới</span>
          <input
            autoFocus
            value={value}
            maxLength={32}
            disabled={loading}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Nhập tên thú cưng"
          />
        </label>

        {error && <div className="rename-modal-error">{error}</div>}

        <div className="rename-modal-actions">
          <button type="button" onClick={onClose} disabled={loading}>
            Hủy
          </button>
          <button type="submit" disabled={loading}>
            {loading ? "Đang lưu..." : "Lưu tên"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ShopPanel() {
  const { shopPets, loading, addingId, error, handleAddPet } = usePetShop();

  if (loading) {
    return <div className="pet-loading">Đang tải shop thú cưng...</div>;
  }

  return (
    <section className="shop-panel">
      {error && <div className="pet-error">{error}</div>}

      <div className="shop-header">
        <div>
          <h2>Shop thú cưng</h2>
          <p>Thêm thú cưng mới vào bộ sưu tập của bạn.</p>
        </div>
      </div>

      {shopPets.length === 0 ? (
        <div className="pet-empty">Shop hiện chưa có thú cưng nào.</div>
      ) : (
        <div className="shop-grid">
          {shopPets.map((pet) => (
            <ShopPetCard
              key={pet.id}
              pet={pet}
              adding={addingId === pet.id}
              onAdd={() => handleAddPet(pet.id)}
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
  const theme = getPetTheme(pet.code);

  return (
    <article className="shop-pet-card">
      <div className={`shop-pet-cover ${theme}`}>
        {pet.premium && <span className="premium-badge">★ Cao cấp</span>}

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
          {pet.description || "Chưa có mô tả cho thú cưng này."}
        </span>

        <div className="shop-meta">
          <span>Loại</span>
          <strong>{pet.premium ? "Cao cấp" : "Thường"}</strong>
        </div>

        <button type="button" disabled={adding} onClick={onAdd}>
          {adding ? "Đang thêm..." : "Thêm ngay"}
        </button>
      </div>
    </article>
  );
}
function formatPetCode(code: string) {
  return code.replace(/_/g, " ").toUpperCase();
}

function getPetEmoji(code: string) {
  const lowerCode = code.toLowerCase();

  if (lowerCode.includes("dragon")) return "🐉";
  if (lowerCode.includes("cat")) return "🐈";
  if (lowerCode.includes("dog") || lowerCode.includes("shiba")) return "🐕";
  if (lowerCode.includes("fish")) return "🐠";

  return "🐾";
}

function getPetTheme(code: string) {
  const lowerCode = code.toLowerCase();

  if (lowerCode.includes("dragon")) return "theme-pink";
  if (lowerCode.includes("shiba") || lowerCode.includes("dog")) return "theme-orange";
  if (lowerCode.includes("cat")) return "theme-purple";
  if (lowerCode.includes("fish")) return "theme-yellow";

  return "theme-blue";
}
