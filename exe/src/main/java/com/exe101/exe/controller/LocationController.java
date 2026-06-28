package com.exe101.exe.controller;

import com.exe101.exe.dto.response.LocationOptionResponse;
import com.exe101.exe.service.LocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/locations")
@RequiredArgsConstructor
public class LocationController {

    private final LocationService locationService;

    @GetMapping("/provinces")
    public List<LocationOptionResponse> getProvinces() {
        return locationService.getProvinces();
    }

    @GetMapping("/wards")
    public List<LocationOptionResponse> getWardsByProvince(
            @RequestParam Integer provinceCode
    ) {
        return locationService.getWardsByProvince(provinceCode);
    }
}