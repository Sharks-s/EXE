package com.exe101.exe.service;

import com.exe101.exe.dto.response.LandingStatsResponse;
import com.exe101.exe.dto.response.LandingTestimonialResponse;

import java.util.List;

public interface LandingStatsService {
    LandingStatsResponse getStats();

    List<LandingTestimonialResponse> getTestimonials();
}
