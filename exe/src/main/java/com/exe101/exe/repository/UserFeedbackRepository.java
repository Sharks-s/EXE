package com.exe101.exe.repository;

import com.exe101.exe.model.entity.UserFeedback;
import com.exe101.exe.model.enums.UserFeedbackStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserFeedbackRepository extends JpaRepository<UserFeedback, Long> {
    List<UserFeedback> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<UserFeedback> findByIdAndUserId(Long id, Long userId);

    List<UserFeedback> findAllByOrderByCreatedAtDesc();

    @Query("""
            select feedback
            from UserFeedback feedback
            join fetch feedback.user user
            where feedback.rating >= :minRating
              and feedback.status = :status
              and length(trim(feedback.content)) > 0
            order by feedback.rating desc, feedback.createdAt desc
            """)
    List<UserFeedback> findLandingTestimonials(
            @Param("minRating") Integer minRating,
            @Param("status") UserFeedbackStatus status,
            Pageable pageable
    );
}
