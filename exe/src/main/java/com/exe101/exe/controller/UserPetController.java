package com.exe101.exe.controller;

import com.exe101.exe.dto.response.ApiResponse;
import com.exe101.exe.dto.response.UserPetSessionResponse;
import com.exe101.exe.dto.response.UserPetSummaryResponse;
import com.exe101.exe.security.CustomUserDetails;
import com.exe101.exe.service.UserPetService;
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

    @GetMapping
    public ApiResponse<List<UserPetSummaryResponse>> listMyPets(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        List<UserPetSummaryResponse> response =
                userPetService.listMyPets(userDetails.getId());
        return ApiResponse.success(response);
    }
}