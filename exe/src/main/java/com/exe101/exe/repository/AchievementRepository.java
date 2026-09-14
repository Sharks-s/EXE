package com.exe101.exe.repository;

import com.exe101.exe.model.entity.Achievement;
import com.exe101.exe.model.enums.AchievementCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AchievementRepository extends JpaRepository<Achievement, Long> {
    Optional<Achievement> findByCode(String code);

    List<Achievement> findByActiveTrueOrderByCategoryAscTargetValueAsc();

    List<Achievement> findByActiveTrueAndCategoryInOrderByCategoryAscTargetValueAsc(Collection<AchievementCategory> categories);
}
