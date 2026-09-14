package com.exe101.exe.controller;

import com.exe101.exe.dto.request.UpdatePetRequest;
import com.exe101.exe.dto.response.AdminPetResponse;
import com.exe101.exe.dto.response.ApiResponse;
import com.exe101.exe.dto.response.PetResponse;
import com.exe101.exe.security.CustomUserDetails;
import com.exe101.exe.service.PetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/pets")
@RequiredArgsConstructor
public class PetController {

    private final PetService petService;

    @GetMapping
    public ApiResponse<List<PetResponse>> getAll(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ApiResponse.success(petService.getAll(userDetails.getId()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public ApiResponse<AdminPetResponse> getById(@PathVariable Long id) {
        return ApiResponse.success(petService.adminGetById(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ApiResponse<AdminPetResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePetRequest request
    ) {
        return ApiResponse.success(petService.adminUpdate(id, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/all")
    public ApiResponse<List<AdminPetResponse>> adminGetAll() {
        return ApiResponse.success(petService.adminGetAll());
    }
}