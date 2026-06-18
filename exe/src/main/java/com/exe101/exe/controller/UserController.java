package com.exe101.exe.controller;

import com.exe101.exe.dto.request.CompleteBasicProfileRequest;
import com.exe101.exe.dto.response.ApiResponse;
import com.exe101.exe.dto.response.ProfileCompletionResponse;
import com.exe101.exe.dto.response.UserSummary;
import com.exe101.exe.mapper.UserMapper;
import com.exe101.exe.model.entity.User;
import com.exe101.exe.security.CustomUserDetails;
import com.exe101.exe.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/users/me")
public class UserController {

    private final UserService userService;
    private final UserMapper userMapper;

    @GetMapping("/profile-completion")
    public ApiResponse<ProfileCompletionResponse> getProfileCompletion(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ApiResponse.success(userService.getProfileCompletion(userDetails.getId()));
    }

    @PutMapping("/basic-profile")
    public ApiResponse<UserSummary> completeBasicProfile(
            @Valid @RequestBody CompleteBasicProfileRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ApiResponse.success(
                userMapper.toSummary(userService.completeBasicProfile(userDetails.getId(), request))
        );
    }


    @PutMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<?> updateMyAvatar(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam("avatar") MultipartFile avatar
    ) {
        User user = userService.updateAvatar(userDetails.getId(), avatar);

        return ApiResponse.success(userMapper.toSummary(user));
    }

    @GetMapping
    public ApiResponse<UserSummary> getMyProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ){
        User user = userService.findById(userDetails.getId());
        return ApiResponse.success(userMapper.toSummary(user));
    }
}
