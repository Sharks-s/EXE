package com.exe101.exe.service;

import com.exe101.exe.dto.response.AdminUserDetailResponse;
import com.exe101.exe.dto.response.AdminUserListItem;
import com.exe101.exe.dto.response.PagedResponse;
import com.exe101.exe.model.enums.UserStatus;

public interface AdminUserService {
    PagedResponse<AdminUserListItem> listUsers(String keyword, UserStatus status, int page, int size);
    AdminUserDetailResponse getUserDetail(Long userId);
    AdminUserDetailResponse updateUserStatus(Long userId, UserStatus newStatus);
}