package com.exe101.exe.repository;

import com.exe101.exe.model.entity.Personality;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PersonalityRepository extends JpaRepository<Personality, Long> {
    Optional<Personality> findByCode(String code);
    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);

    Optional<Personality> findByCodeIgnoreCase(String code);
}