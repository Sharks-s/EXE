package com.exe101.exe.controller;

import com.exe101.exe.dto.response.ApiResponse;
import com.exe101.exe.dto.response.PersonalityResponse;
import com.exe101.exe.service.PersonalityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/personalities")
@RequiredArgsConstructor
public class PersonalityController {

    private final PersonalityService personalityService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PersonalityResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(personalityService.getAll()));
    }

    @GetMapping("/{code}")
    public ResponseEntity<ApiResponse<PersonalityResponse>> getByCode(@PathVariable String code) {
        return ResponseEntity.ok(ApiResponse.success(personalityService.getByCode(code)));
    }
}