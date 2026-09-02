package com.exe101.exe.repository;

import com.exe101.exe.model.entity.Song;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SongRepository extends JpaRepository<Song, Long> {

    List<Song> findByUserIdOrderByOrderIndexAsc(Long userId);

    boolean existsByUserIdAndFilePath(Long userId, String filePath);
    
    @Query("SELECT MAX(s.orderIndex) FROM Song s WHERE s.user.id = :userId")
    Optional<Integer> findMaxOrderIndexByUserId(@Param("userId") Long userId);
}