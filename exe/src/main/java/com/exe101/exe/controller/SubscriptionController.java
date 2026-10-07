package com.exe101.exe.controller;

import com.exe101.exe.dto.request.UpgradeSubscriptionRequest;
import com.exe101.exe.dto.response.ApiResponse;
import com.exe101.exe.dto.response.SubscriptionPlanResponse;
import com.exe101.exe.dto.response.SubscriptionResponse;
import com.exe101.exe.security.CustomUserDetails;
import com.exe101.exe.service.SubscriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @GetMapping("/plans")
    public ApiResponse<List<SubscriptionPlanResponse>> getPlans() {
        return ApiResponse.success(subscriptionService.getActivePlans());
    }

    @GetMapping("/me")
    public ApiResponse<SubscriptionResponse> getCurrentSubscription(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(subscriptionService.getCurrentSubscription(userDetails.getId()));
    }

    @PostMapping("/upgrade-pro")
    public ApiResponse<SubscriptionResponse> upgradeToPro(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody UpgradeSubscriptionRequest request
    ) {
        return ApiResponse.success(subscriptionService.upgradeToPro(userDetails.getId(), request.planCode()));
    }

    @PostMapping("/me/cancel")
    public ApiResponse<SubscriptionResponse> cancelCurrentSubscription(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(subscriptionService.cancelCurrentSubscription(userDetails.getId()));
    }

    @DeleteMapping("/me")
    public ApiResponse<SubscriptionResponse> deleteCurrentSubscription(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(subscriptionService.cancelCurrentSubscription(userDetails.getId()));
    }
}
