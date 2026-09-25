package com.exe101.exe.controller;

import com.exe101.exe.dto.response.ApiResponse;
import com.exe101.exe.dto.response.LandingStatsResponse;
import com.exe101.exe.dto.response.LandingTestimonialResponse;
import com.exe101.exe.service.LandingStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/public/landing")
@RequiredArgsConstructor
public class PublicLandingController {

    private final LandingStatsService landingStatsService;

    @GetMapping("/stats")
    public ApiResponse<LandingStatsResponse> getStats() {
        return ApiResponse.success(landingStatsService.getStats());
    }

    @GetMapping("/testimonials")
    public ApiResponse<List<LandingTestimonialResponse>> getTestimonials() {
        return ApiResponse.success(landingStatsService.getTestimonials());
    }
}
