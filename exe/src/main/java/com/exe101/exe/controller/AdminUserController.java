package com.exe101.exe.controller;

import com.exe101.exe.dto.request.UpdateUserRoleRequest;
import com.exe101.exe.dto.request.UpdateUserStatusRequest;
import com.exe101.exe.dto.response.AdminUserDetailResponse;
import com.exe101.exe.dto.response.AdminUserListItem;
import com.exe101.exe.dto.response.ApiResponse;
import com.exe101.exe.dto.response.PagedResponse;
import com.exe101.exe.model.enums.UserStatus;
import com.exe101.exe.service.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ApiResponse<PagedResponse<AdminUserListItem>> listUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.success(adminUserService.listUsers(keyword, status, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<AdminUserDetailResponse> getUserDetail(@PathVariable Long id) {
        return ApiResponse.success(adminUserService.getUserDetail(id));
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<AdminUserDetailResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserStatusRequest request
    ) {
        return ApiResponse.success(adminUserService.updateUserStatus(id, request.status()));
    }

    @PatchMapping("/{id}/role")
    public ApiResponse<AdminUserDetailResponse> updateRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRoleRequest request
    ) {
        return ApiResponse.success(adminUserService.updateUserRole(id, request.roleCode()));
    }
}