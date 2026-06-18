package com.exe101.exe.service;

import com.exe101.exe.dto.request.CreatePersonalityRequest;
import com.exe101.exe.dto.request.UpdatePersonalityRequest;
import com.exe101.exe.dto.response.PersonalityDetailsResponse;
import com.exe101.exe.dto.response.PersonalityResponse;

import java.util.List;

public interface PersonalityService {
    List<PersonalityResponse> getAll();

    PersonalityResponse getByCode(String code);

    void seedDefaultPersonalities();

    PersonalityResponse getById(Long id);

    PersonalityResponse create(CreatePersonalityRequest request);

    PersonalityResponse update(Long id, UpdatePersonalityRequest request);

    void delete(Long id);

    PersonalityDetailsResponse getDetails(Long personalityId);
}
