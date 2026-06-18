package com.exe101.exe.service;

import com.exe101.exe.dto.response.UserPetSessionResponse;
import com.exe101.exe.dto.response.UserPetSummaryResponse;
import com.exe101.exe.model.entity.User;
import com.exe101.exe.model.entity.UserPet;

import java.util.List;

public interface UserPetService {
    UserPet provisionDefaultPet(User user);
    boolean hasAnyPet(Long userId);
    UserPetSessionResponse getUserPetForSession(Long userPetId, Long requestingUserId);
    List<UserPetSummaryResponse> listMyPets(Long userId);
    UserPetSummaryResponse getUserPetSummary(Long userPetId);
    UserPetSummaryResponse renameUserPet(Long userPetId, Long userId, String customName);
    UserPetSummaryResponse addPetFromStore(Long petId, Long userId);
    UserPetSummaryResponse equipUserPet(Long userPetId, Long userId);
}
