package com.exe101.exe.repository;

import com.exe101.exe.model.entity.UserPet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserPetRepository extends JpaRepository<UserPet, Long> {
    Optional<UserPet> findByUserIdAndEquippedTrue(Long userId);

    Optional<UserPet> findDefaultPetByUserId(Long userId);
    Optional<UserPet> findByUserIdAndPetId(Long userId, Long petId);
    boolean existsByUserIdAndPetId(Long userId, Long petId);

    boolean existsByUserId(Long userId);

    @Query("SELECT up FROM UserPet up JOIN FETCH up.pet WHERE up.id = :id")
    Optional<UserPet> findByIdWithPet(@Param("id") Long id);


    @Query("SELECT up FROM UserPet up JOIN FETCH up.pet WHERE up.user.id = :userId ORDER BY up.equipped DESC, up.id ASC")
    List<UserPet> findAllByUserIdWithPet(@Param("userId") Long userId);
}
