package com.exe101.exe.repository;

import com.exe101.exe.model.entity.AppRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AppRuleRepository extends JpaRepository<AppRule, Long> {
    List<AppRule> findByUserIsNull();

    List<AppRule> findByUserId(Long userId);
}