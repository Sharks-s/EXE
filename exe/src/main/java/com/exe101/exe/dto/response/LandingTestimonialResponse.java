package com.exe101.exe.dto.response;

public record LandingTestimonialResponse(
        Long id,
        String name,
        String role,
        String text,
        Integer rating
) {}
