package com.exe101.exe.repository;

import com.exe101.exe.model.entity.Pet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PetRepository extends JpaRepository<Pet, Long> {
    Optional<Pet> findByCode(String code);

    @Query("SELECT p FROM Pet p WHERE NOT EXISTS " +
            "(SELECT 1 FROM UserPet up WHERE up.pet = p AND up.user.id = :userId) " +
            "ORDER BY p.id ASC")
    List<Pet> findAllNotOwnedByUser(@Param("userId") Long userId);
}
