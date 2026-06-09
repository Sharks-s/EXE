package com.exe101.exe.repository;

import com.exe101.exe.model.entity.Personality;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PersonalityRepository extends JpaRepository<Personality, Long> {
}