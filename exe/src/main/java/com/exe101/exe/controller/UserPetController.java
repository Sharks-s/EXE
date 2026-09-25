package com.exe101.exe.controller;

import com.exe101.exe.dto.request.RenameUserPetRequest;
import com.exe101.exe.dto.response.ApiResponse;
import com.exe101.exe.dto.response.UserPetSessionResponse;
import com.exe101.exe.dto.response.UserPetSummaryResponse;
import com.exe101.exe.security.CustomUserDetails;
import com.exe101.exe.service.UserPetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/user-pets")
@RequiredArgsConstructor
public class UserPetController {

    private final UserPetService userPetService;

    @GetMapping("/{userPetId}")
    public ApiResponse<UserPetSessionResponse> getForSession(
            @PathVariable Long userPetId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        UserPetSessionResponse response =
                userPetService.getUserPetForSession(userPetId, userDetails.getId());
        return ApiResponse.success(response);
    }

    @GetMapping("/me")
    public ApiResponse<List<UserPetSummaryResponse>> listMyPets(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        List<UserPetSummaryResponse> response =
                userPetService.listMyPets(userDetails.getId());
        return ApiResponse.success(response);
    }
    @PostMapping("/{userPetId}/rename")
    public ApiResponse<UserPetSummaryResponse> rename(
            @PathVariable Long userPetId,
            @Valid @RequestBody RenameUserPetRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        UserPetSummaryResponse response = userPetService.renameUserPet(
                userPetId,
                userDetails.getId(),
                request.customName()
        );
        return ApiResponse.success(response);
    }

    @PostMapping("/shop/{petId}")
    public ApiResponse<UserPetSummaryResponse> addPetFromStore(
            @PathVariable Long petId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        UserPetSummaryResponse response = userPetService.addPetFromStore(
                petId,
                userDetails.getId()
        );
        return ApiResponse.success(response);
    }

    @PostMapping("/{userPetId}/equip")
    public ApiResponse<UserPetSummaryResponse> equip(
            @PathVariable Long userPetId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        UserPetSummaryResponse response = userPetService.equipUserPet(
                userPetId,
                userDetails.getId()
        );
        return ApiResponse.success(response);
    }

    @PutMapping("/{userPetId}/upgrade")
    public ApiResponse<UserPetSummaryResponse> upgrade(
            @PathVariable Long userPetId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        UserPetSummaryResponse response = userPetService.upgradeUserPet(
                userPetId,
                userDetails.getId()
        );
        return ApiResponse.success(response);
    }

}
