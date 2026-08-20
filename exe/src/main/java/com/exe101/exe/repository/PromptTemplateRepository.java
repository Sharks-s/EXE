package com.exe101.exe.repository;

import com.exe101.exe.model.entity.PromptTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PromptTemplateRepository extends JpaRepository<PromptTemplate, Long> {
    Optional<PromptTemplate> findByPromptKey(String promptKey);

    boolean existsByPromptKey(String promptKey);
}
