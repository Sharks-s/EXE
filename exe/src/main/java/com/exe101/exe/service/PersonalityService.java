package com.exe101.exe.service;

import com.exe101.exe.dto.response.PersonalityResponse;

import java.util.List;

public interface PersonalityService {
    List<PersonalityResponse> getAll();

    PersonalityResponse getByCode(String code);

    void seedDefaultPersonalities();
}
