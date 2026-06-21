package com.exe101.exe.service;

import com.exe101.exe.dto.response.PetResponse;

import java.util.List;

public interface PetService {

    void seedDefaultPets();

    List<PetResponse> getAll(Long userId);

}
