package com.exe101.exe.service;

import com.exe101.exe.dto.response.LocationOptionResponse;

import java.util.List;

public interface LocationService {

    public List<LocationOptionResponse> getProvinces() ;
    public List<LocationOptionResponse> getWardsByProvince(Integer provinceCode);
    }
