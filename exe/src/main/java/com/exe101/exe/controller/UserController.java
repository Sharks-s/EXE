package com.exe101.exe.controller;

import com.exe101.exe.dto.request.CompleteBasicProfileRequest;
import com.exe101.exe.dto.request.ChangePasswordRequest;
import com.exe101.exe.dto.request.UpdateAiAddressRequest;
import com.exe101.exe.dto.response.ApiResponse;
import com.exe101.exe.dto.response.DailyUsageResponse;
import com.exe101.exe.dto.response.ProfileCompletionResponse;
import com.exe101.exe.dto.response.UserSummary;
import com.exe101.exe.mapper.UserMapper;
import com.exe101.exe.model.entity.User;
import com.exe101.exe.security.CookieUtil;
import com.exe101.exe.security.CustomUserDetails;
import com.exe101.exe.service.UserService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/users/me")
public class UserController {

    private final UserService userService;
    private final UserMapper userMapper;
    private final CookieUtil cookieUtil;

    @GetMapping("/profile-completion")
    public ApiResponse<ProfileCompletionResponse> getProfileCompletion(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ApiResponse.success(userService.getProfileCompletion(userDetails.getId()));
    }

    @GetMapping("/daily-usage")
    public ApiResponse<DailyUsageResponse> getDailyUsage(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ApiResponse.success(userService.getDailyUsage(userDetails.getId()));
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
        User user = userService.findByIdWithRoles(userDetails.getId());
        return ApiResponse.success(userMapper.toSummary(user));
    }

    @PutMapping("/password")
    public ApiResponse<UserSummary> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        User user = userService.changePassword(userDetails.getId(), request);
        return ApiResponse.success(userMapper.toSummary(user));
    }

    @DeleteMapping
    public ApiResponse<Void> deleteMyAccount(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            HttpServletResponse response
    ) {
        userService.deleteMyAccount(userDetails.getId());

        ResponseCookie clear = cookieUtil.clearRefreshCookie();
        response.addHeader(HttpHeaders.SET_COOKIE, clear.toString());

        return ApiResponse.success(null);
    }

    @PutMapping("/ai-address")
    public ApiResponse<UserSummary> updateAiAddress(
            @Valid @RequestBody UpdateAiAddressRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        User user = userService.updateAiAddress(userDetails.getId(), request);
        return ApiResponse.success(userMapper.toSummary(user));
    }

}
