package com.exe101.exe.controller;

import com.exe101.exe.dto.request.CreatePersonalityRequest;
import com.exe101.exe.dto.request.UpdatePersonalityRequest;
import com.exe101.exe.dto.response.ApiResponse;
import com.exe101.exe.dto.response.PersonalityResponse;
import com.exe101.exe.service.PersonalityService;
import jakarta.validation.Valid;
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
    @PostMapping
    public ResponseEntity<ApiResponse<PersonalityResponse>> create(
            @Valid @RequestBody CreatePersonalityRequest request
    ) {
        return ResponseEntity
                .ok(ApiResponse.success(personalityService.create(request)));
    }

    @GetMapping("/id/{id}")
    public ResponseEntity<ApiResponse<PersonalityResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(personalityService.getById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PersonalityResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePersonalityRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(personalityService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        personalityService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}