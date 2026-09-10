import { useTranslation } from "react-i18next";

export type FilterType = "all" | "equipped" | "premium" | "normal";
export type SortType = "level-desc" | "level-asc";

type PetToolbarProps = {
    keyword: string;
    filter: FilterType;
    sort: SortType;
    onKeywordChange: (value: string) => void;
    onFilterChange: (value: FilterType) => void;
    onSortChange: (value: SortType) => void;
};

export function PetToolbar({
    keyword,
    filter,
    sort,
    onKeywordChange,
    onFilterChange,
    onSortChange,
}: PetToolbarProps) {
    const { t } = useTranslation();

    return (
        <section className="pet-toolbar">
            <div className="pet-search">
                <span>⌕</span>
                <input
                    value={keyword}
                    onChange={(event) => onKeywordChange(event.target.value)}
                    placeholder={t("common:pet.search_placeholder")}
                />
            </div>

            <select
                value={filter}
                onChange={(event) =>
                    onFilterChange(event.target.value as FilterType)
                }
            >
                <option value="all">{t("common:pet.filter_all")}</option>
                <option value="equipped">
                    {t("common:pet.filter_equipped")}
                </option>
                <option value="premium">
                    {t("common:pet.filter_premium")}
                </option>
                <option value="normal">
                    {t("common:pet.filter_normal")}
                </option>
            </select>

            <select
                value={sort}
                onChange={(event) =>
                    onSortChange(event.target.value as SortType)
                }
            >
                <option value="level-desc">
                    {t("common:pet.sort_level_desc")}
                </option>
                <option value="level-asc">
                    {t("common:pet.sort_level_asc")}
                </option>
            </select>
        </section>
    );
}