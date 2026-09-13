package com.exe101.exe.service.impl;

import com.exe101.exe.dto.response.AdminUserDetailResponse;
import com.exe101.exe.dto.response.AdminUserListItem;
import com.exe101.exe.dto.response.PagedResponse;
import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.model.entity.User;
import com.exe101.exe.model.entity.UserRole;
import com.exe101.exe.model.enums.UserStatus;
import com.exe101.exe.repository.FocusSessionRepository;
import com.exe101.exe.repository.SubscriptionRepository;
import com.exe101.exe.repository.UserRepository;
import com.exe101.exe.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminUserServiceImpl implements AdminUserService {

    private static final Set<UserStatus> ADMIN_SETTABLE_STATUS =
            EnumSet.of(UserStatus.ACTIVE, UserStatus.DEACTIVATED, UserStatus.SUSPENDED, UserStatus.BLOCKED);

    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final FocusSessionRepository focusSessionRepository;

    @Override
    public PagedResponse<AdminUserListItem> listUsers(String keyword, UserStatus status, int page, int size) {
        Page<User> result = userRepository.searchUsers(
                keyword, status,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );

        List<User> users = result.getContent();

        // 1. Lấy danh sách user IDs trên trang hiện tại
        List<Long> userIds = users.stream().map(User::getId).toList();

        // 2. Query 1 lần duy nhất để lấy tập hợp các user đang có Premium active
        Set<Long> premiumUserIds = subscriptionRepository.findActivePremiumUserIds(userIds);

        List<AdminUserListItem> items = users.stream()
                .map(u -> new AdminUserListItem(
                        u.getId(),
                        u.getEmail(),
                        u.getFullName(),
                        u.getAvatarUrl(),
                        u.getStatus(),
                        premiumUserIds.contains(u.getId()),
                        u.getLastLoginAt(),
                        u.getCreatedAt()
                ))
                .toList();

        return new PagedResponse<>(
                items,
                result.getNumber(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.hasNext()
        );
    }

    @Override
    public AdminUserDetailResponse getUserDetail(Long userId) {
        User u = userRepository.findByIdWithRoles(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        boolean isPremium = subscriptionRepository.existsByUserIdAndIsActiveTrue(userId);
        long totalSessions = focusSessionRepository.countByUserId(userId);

        List<String> roles = u.getUserRoles().stream()
                .filter(UserRole::isActive) // Đã đổi thành Method Reference cho gọn
                .map(ur -> ur.getRole().getCode())
                .toList();

        return new AdminUserDetailResponse(
                u.getId(), u.getEmail(), u.getFullName(), u.getAvatarUrl(),
                u.getPhoneNumber(), u.getGender(), u.getDateOfBirth(), u.getStatus(),
                u.getDailyUsedMinutes(), u.isOnboardingCompleted(), u.isProfileCompleted(),
                u.getPersonality() != null ? u.getPersonality().getCode() : null,
                roles, isPremium, u.getLastLoginAt(), u.getCreatedAt(),
                totalSessions
        );
    }

    @Override
    @Transactional
    public AdminUserDetailResponse updateUserStatus(Long userId, UserStatus newStatus) {
        if (!ADMIN_SETTABLE_STATUS.contains(newStatus)) {
            throw new BusinessException(ErrorCode.INVALID_ADMIN_USER_STATUS);
        }

        User u = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        u.setStatus(newStatus);
        userRepository.save(u);

        return getUserDetail(userId);
    }
}