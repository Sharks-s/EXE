package com.exe101.exe.controller;

import com.exe101.exe.dto.response.ApiResponse;
import com.exe101.exe.dto.response.PagedResponse;
import com.exe101.exe.dto.response.PointTransactionResponse;
import com.exe101.exe.dto.response.WalletResponse;
import com.exe101.exe.security.CustomUserDetails;
import com.exe101.exe.service.PointService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/points")
@RequiredArgsConstructor
public class PointController {

    private final PointService pointService;

    @GetMapping("/wallet")
    public ApiResponse<WalletResponse> getWallet(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ApiResponse.success(pointService.getWallet(userDetails.getId()));
    }

    @GetMapping("/transactions")
    public ApiResponse<PagedResponse<PointTransactionResponse>> getTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ApiResponse.success(pointService.getTransactions(userDetails.getId(), page, size));
    }
}
