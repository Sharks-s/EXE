package com.exe101.exe.repository;

import com.exe101.exe.model.entity.UserPet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserPetRepository extends JpaRepository<UserPet, Long> {
    Optional<UserPet> findByUserIdAndEquippedTrue(Long userId);

    Optional<UserPet> findDefaultPetByUserId(Long userId);
}
