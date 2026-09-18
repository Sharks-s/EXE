package com.exe101.exe.service.impl;

import com.exe101.exe.dto.response.AdminUserDetailResponse;
import com.exe101.exe.dto.response.AdminUserListItem;
import com.exe101.exe.dto.response.PagedResponse;
import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.model.entity.Role;
import com.exe101.exe.model.entity.User;
import com.exe101.exe.model.entity.UserRole;
import com.exe101.exe.model.enums.UserStatus;
import com.exe101.exe.repository.FocusSessionRepository;
import com.exe101.exe.repository.RoleRepository;
import com.exe101.exe.repository.SubscriptionRepository;
import com.exe101.exe.repository.UserRepository;
import com.exe101.exe.repository.UserRoleRepository;
import com.exe101.exe.security.CustomUserDetails;
import com.exe101.exe.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
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
    private final UserRoleRepository userRoleRepository;
    private final RoleRepository roleRepository;

    /**
     * Tìm kiếm và phân trang danh sách người dùng kèm trạng thái gói Premium.
     */
    @Override
    public PagedResponse<AdminUserListItem> listUsers(String keyword, UserStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<AdminUserListItem> result = userRepository.searchUsers(keyword, status, pageable);

        List<Long> userIds = result.getContent()
                .stream()
                .map(AdminUserListItem::getId)
                .toList();

        Set<Long> premiumUserIds = userIds.isEmpty()
                ? Set.of()
                : subscriptionRepository.findActivePremiumUserIds(
                userIds,
                Instant.now()
        );

        result.getContent().forEach(user ->
                user.setPremium(premiumUserIds.contains(user.getId()))
        );

        return new PagedResponse<>(
                result.getContent(),
                result.getNumber(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.hasNext()
        );
    }

    /**
     * Lấy thông tin chi tiết của người dùng theo ID (bao gồm danh sách role, thống kê session, premium).
     */
    @Override
    public AdminUserDetailResponse getUserDetail(Long userId) {
        User u = userRepository.findByIdWithRoles(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        boolean isPremium = subscriptionRepository.hasActiveProAccess(userId, Instant.now());
        long totalSessions = focusSessionRepository.countByUserId(userId);

        List<String> roles = u.getUserRoles().stream()
                .filter(UserRole::isActive)
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

    /**
     * Cập nhật trạng thái người dùng (Active, Suspended, Blocked...).
     * Ràng buộc: Không tự sửa bản thân, không sửa Super Admin, Admin không được sửa Admin khác.
     */
    @Override
    @Transactional
    public AdminUserDetailResponse updateUserStatus(Long targetUserId, UserStatus newStatus) {
        if (!ADMIN_SETTABLE_STATUS.contains(newStatus)) {
            throw new BusinessException(ErrorCode.INVALID_ADMIN_USER_STATUS);
        }

        CustomUserDetails currentUser = getCurrentUserDetails();

        if (currentUser.getId().equals(targetUserId)) {
            throw new BusinessException(ErrorCode.CANNOT_MODIFY_OWN_ACCOUNT);
        }

        User targetUser = userRepository.findByIdWithRoles(targetUserId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        boolean isTargetSuperAdmin = isUserInRole(targetUser, "SUPER_ADMIN");
        boolean isTargetAdmin = isUserInRole(targetUser, "ADMIN");
        boolean isCurrentSuperAdmin = isCurrentSuperAdmin(currentUser);

        if (isTargetSuperAdmin) {
            throw new BusinessException(ErrorCode.CANNOT_MODIFY_SUPER_ADMIN);
        }

        if (!isCurrentSuperAdmin && isTargetAdmin) {
            throw new BusinessException(ErrorCode.INSUFFICIENT_ADMIN_PERMISSION);
        }

        targetUser.setStatus(newStatus);
        return getUserDetail(targetUserId);
    }

    /**
     * Thay đổi vai trò người dùng (USER, ADMIN).
     * Ràng buộc: Không tự sửa bản thân, không ai có thể tạo thêm hay đổi role của Super Admin duy nhất,
     * chỉ Super Admin mới có quyền phong/hạ quyền liên quan đến ADMIN.
     */
    @Override
    @Transactional
    public AdminUserDetailResponse updateUserRole(Long targetUserId, String roleCode) {
        if (roleCode == null || roleCode.isBlank()) {
            throw new BusinessException(ErrorCode.ROLE_NOT_FOUND);
        }
        String normalizedRoleCode = roleCode.trim().toUpperCase();

        CustomUserDetails currentUser = getCurrentUserDetails();

        if (currentUser.getId().equals(targetUserId)) {
            throw new BusinessException(ErrorCode.CANNOT_MODIFY_OWN_ACCOUNT);
        }

        User targetUser = userRepository.findByIdWithRoles(targetUserId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        boolean isTargetSuperAdmin = isUserInRole(targetUser, "SUPER_ADMIN");
        boolean isCurrentSuperAdmin = isCurrentSuperAdmin(currentUser);

        if (isTargetSuperAdmin) {
            throw new BusinessException(ErrorCode.CANNOT_MODIFY_SUPER_ADMIN);
        }

        if ("SUPER_ADMIN".equals(normalizedRoleCode)) {
            throw new BusinessException(ErrorCode.INSUFFICIENT_ADMIN_PERMISSION);
        }

        boolean isTargetAdmin = isUserInRole(targetUser, "ADMIN");
        boolean isPromotingToAdmin = "ADMIN".equals(normalizedRoleCode);

        if (!isCurrentSuperAdmin && (isTargetAdmin || isPromotingToAdmin)) {
            throw new BusinessException(ErrorCode.INSUFFICIENT_ADMIN_PERMISSION);
        }

        Role newRole = roleRepository.findByCode(normalizedRoleCode)
                .orElseThrow(() -> new BusinessException(ErrorCode.ROLE_NOT_FOUND));

        List<UserRole> currentRoles = userRoleRepository.findAllByUser(targetUser);
        for (UserRole ur : currentRoles) {
            if (ur.isActive()) {
                ur.setActive(false);
            }
        }

        UserRole targetRole = currentRoles.stream()
                .filter(ur -> ur.getRole().getCode().equalsIgnoreCase(normalizedRoleCode))
                .findFirst()
                .orElse(null);

        Instant now = Instant.now();
        if (targetRole != null) {
            targetRole.setActive(true);
            targetRole.setAssignedAt(now);
            targetRole.setAssignedBy(currentUser.getUser().getId());
        } else {
            UserRole newUserRole = UserRole.builder()
                    .user(targetUser)
                    .role(newRole)
                    .active(true)
                    .assignedAt(now)
                    .assignedBy(currentUser.getUser().getId())
                    .build();
            userRoleRepository.save(newUserRole);
        }

        return getUserDetail(targetUserId);
    }

    private CustomUserDetails getCurrentUserDetails() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof CustomUserDetails)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return (CustomUserDetails) auth.getPrincipal();
    }

    private boolean isCurrentSuperAdmin(CustomUserDetails currentUser) {
        return currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }

    private boolean isUserInRole(User user, String roleCode) {
        if (user.getUserRoles() == null) return false;
        return user.getUserRoles().stream()
                .filter(UserRole::isActive)
                .anyMatch(ur -> ur.getRole().getCode().equalsIgnoreCase(roleCode));
    }
}