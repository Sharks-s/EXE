package com.exe101.exe.service.impl;

import com.exe101.exe.dto.response.LocationOptionResponse;
import com.exe101.exe.model.entity.Province;
import com.exe101.exe.model.entity.Ward;
import com.exe101.exe.repository.ProvinceRepository;
import com.exe101.exe.repository.WardRepository;
import com.exe101.exe.service.LocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LocationServiceImpl implements LocationService {

    private final ProvinceRepository provinceRepository;
    private final WardRepository wardRepository;

    public List<LocationOptionResponse> getProvinces() {
        return provinceRepository.findAll()
                .stream()
                .map(this::toProvinceOption)
                .toList();
    }

    public List<LocationOptionResponse> getWardsByProvince(Integer provinceCode) {
        return wardRepository.findByProvinceCodeOrderByNameAsc(provinceCode)
                .stream()
                .map(this::toWardOption)
                .toList();
    }

    private LocationOptionResponse toProvinceOption(Province province) {
        return LocationOptionResponse.builder()
                .code(province.getCode())
                .codeName(province.getCodeName())
                .name(province.getName())
                .build();
    }

    private LocationOptionResponse toWardOption(Ward ward) {
        return LocationOptionResponse.builder()
                .code(ward.getCode())
                .codeName(ward.getCodeName())
                .name(ward.getName())
                .build();
    }
}