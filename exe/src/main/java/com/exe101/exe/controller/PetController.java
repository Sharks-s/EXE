package com.exe101.exe.controller;

import com.exe101.exe.dto.response.ApiResponse;
import com.exe101.exe.dto.response.PetResponse;
import com.exe101.exe.security.CustomUserDetails;
import com.exe101.exe.service.PetService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
