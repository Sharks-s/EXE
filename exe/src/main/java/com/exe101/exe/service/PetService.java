package com.exe101.exe.service;

import com.exe101.exe.dto.request.UpdatePetRequest;
import com.exe101.exe.dto.response.AdminPetResponse;
import com.exe101.exe.dto.response.PetResponse;

import java.util.List;

public interface PetService {

    void seedDefaultPets();

    List<PetResponse> getAll(Long userId);

    List<AdminPetResponse> adminGetAll();
    AdminPetResponse adminGetById(Long id);
    AdminPetResponse adminUpdate(Long id, UpdatePetRequest request);

}
