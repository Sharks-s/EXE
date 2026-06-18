package com.exe101.exe.service.impl;

import com.exe101.exe.config.AppSeedProperties;
import com.exe101.exe.dto.response.UserPetSessionResponse;
import com.exe101.exe.dto.response.UserPetSummaryResponse;
import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.model.entity.Pet;
import com.exe101.exe.model.entity.User;
import com.exe101.exe.model.entity.UserPet;
import com.exe101.exe.repository.PetRepository;
import com.exe101.exe.repository.UserPetRepository;
import com.exe101.exe.service.UserPetService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserPetServiceImpl implements UserPetService {

    private final AppSeedProperties appSeedProperties;
    private final PetRepository petRepository;
    private final UserPetRepository userPetRepository;

    @Override
    @Transactional
    public UserPet provisionDefaultPet(User user) {
        String defaultPetCode = appSeedProperties.getDefaultPetCode();
        if (defaultPetCode == null || defaultPetCode.isBlank()) {
            throw new BusinessException(ErrorCode.DEFAULT_PET_NOT_CONFIGURED);
        }

        Pet defaultPet = petRepository.findByCode(defaultPetCode)
                .orElseThrow(() -> new BusinessException(ErrorCode.DEFAULT_PET_NOT_FOUND));

        UserPet userPet = UserPet.builder()
                .user(user)
                .pet(defaultPet)
                .customName(defaultPet.getName())
                .level(1)
                .experience(0)
                .equipped(true)
                .isDefault(true)
                .build();

        try {
            return userPetRepository.save(userPet);
        } catch (DataIntegrityViolationException ex) {
            // đã có rồi (race condition / gọi 2 lần) -> lấy bản ghi cũ trả về, không fail
            return userPetRepository.findByUserIdAndPetId(user.getId(), defaultPet.getId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.USER_PET_PROVISION_FAILED));
        }
    }

    @Override
    public boolean hasAnyPet(Long userId) {
        return userPetRepository.existsByUserId(userId);
    }


    @Override
    public UserPetSessionResponse getUserPetForSession(Long userPetId, Long requestingUserId) {
        UserPet userPet = userPetRepository.findByIdWithPet(userPetId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_PET_NOT_FOUND));

        // Chặn user A xem pet của user B qua việc đoán ID
        if (!userPet.getUser().getId().equals(requestingUserId)) {
            throw new BusinessException(ErrorCode.USER_PET_NOT_FOUND);
        }

        Pet pet = userPet.getPet();

        return UserPetSessionResponse.builder()
                .userPetId(userPet.getId())
                .code(pet.getCode())
                .customName(userPet.getCustomName())
                .level(userPet.getLevel())
                .experience(userPet.getExperience())
                .imageUrl(pet.getImageUrl())
                .build();
    }

    // ── Use-case: list pet để CHỌN trước khi vào session ────────────────
    @Override
    public List<UserPetSummaryResponse> listMyPets(Long userId) {
        return userPetRepository.findAllByUserIdWithPet(userId).stream()
                .map(userPet -> {
                    Pet pet = userPet.getPet();
                    return UserPetSummaryResponse.builder()
                            .userPetId(userPet.getId())
                            .code(pet.getCode())
                            .customName(userPet.getCustomName())
                            .level(userPet.getLevel())
                            .imageUrl(pet.getImageUrl())
                            .premium(pet.isPremium())
                            .equipped(userPet.isEquipped())
                            .build();
                })
                .toList();
    }

}