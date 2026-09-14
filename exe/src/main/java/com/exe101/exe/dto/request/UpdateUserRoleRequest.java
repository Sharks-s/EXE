package com.exe101.exe.dto.request;

import jakarta.validation.constraints.NotBlank;

public record UpdateUserRoleRequest(
        @NotBlank String roleCode  // "ADMIN" hoặc "USER"
) {}