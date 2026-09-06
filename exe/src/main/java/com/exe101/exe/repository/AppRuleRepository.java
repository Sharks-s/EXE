package com.exe101.exe.repository;

import com.exe101.exe.model.entity.AppRule;
import com.exe101.exe.model.enums.RuleType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AppRuleRepository extends JpaRepository<AppRule, Long> {
    List<AppRule> findByUserIsNull();

    List<AppRule> findByUserId(Long userId);

    boolean existsByUserIsNullAndAppNameAndWindowTitleKeywordAndRuleType(
            String appName,
            String windowTitleKeyword,
            RuleType ruleType
    );

    Optional<AppRule> findByIdAndUserId(Long id, Long userId);

    void deleteByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndWindowTitleKeywordAndRuleType(Long userId, String windowTitleKeyword, RuleType ruleType);
}
