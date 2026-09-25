package com.exe101.exe.service.impl;

import com.exe101.exe.config.AppSeedProperties;
import com.exe101.exe.dto.response.UserPetSessionResponse;
import com.exe101.exe.dto.response.UserPetSummaryResponse;
import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.model.entity.Pet;
import com.exe101.exe.model.entity.User;
import com.exe101.exe.model.entity.UserPet;
import com.exe101.exe.model.enums.PointTransactionType;
import com.exe101.exe.repository.PetRepository;
import com.exe101.exe.repository.UserPetRepository;
import com.exe101.exe.service.AppSettingService;
import com.exe101.exe.service.PointService;
import com.exe101.exe.service.UserPetService;
import com.exe101.exe.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserPetServiceImpl implements UserPetService {

    private static final int MAX_PET_LEVEL = 25;
    private static final int XP_PER_LEVEL = 100;

    private final AppSeedProperties appSeedProperties;
    private final AppSettingService appSettingService;
    private final PetRepository petRepository;
    private final UserPetRepository userPetRepository;
    private final UserService userService;
    private final PointService pointService;

    @Override
    @Transactional
    public UserPet provisionDefaultPet(User user) {
        String defaultPetCode = appSettingService.getString(
                AppSettingServiceImpl.DEFAULT_PET_CODE,
                appSeedProperties.getDefaultPetCode());
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
                            .experience(userPet.getExperience())
                            .imageUrl(pet.getImageUrl())
                            .premium(pet.isPremium())
                            .equipped(userPet.isEquipped())
                            .price(pet.getPrice())
                            .rarity(pet.getRarity())
                            .build();
                })
                .toList();
    }

    @Override
    public UserPetSummaryResponse getUserPetSummary(Long userPetId) {
        UserPet userPet = userPetRepository.findByIdWithPet(userPetId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_PET_NOT_FOUND));

        Pet pet = userPet.getPet();

        return UserPetSummaryResponse.builder()
                .userPetId(userPet.getId())
                .code(pet.getCode())
                .customName(userPet.getCustomName())
                .level(userPet.getLevel())
                .experience(userPet.getExperience())
                .imageUrl(pet.getImageUrl())
                .premium(pet.isPremium())
                .equipped(userPet.isEquipped())
                .price(pet.getPrice())
                .rarity(pet.getRarity())
                .build();
    }

    @Override
    @Transactional
    public UserPetSummaryResponse renameUserPet(Long userPetId, Long userId, String customName) {
        UserPet userPet = userPetRepository.findByIdWithPet(userPetId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_PET_NOT_FOUND));

        if (!userPet.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.USER_PET_NOT_FOUND);
        }

        userPet.setCustomName(customName.trim());
        userPetRepository.save(userPet);

        Pet pet = userPet.getPet();

        return UserPetSummaryResponse.builder()
                .userPetId(userPet.getId())
                .code(pet.getCode())
                .customName(userPet.getCustomName())
                .level(userPet.getLevel())
                .experience(userPet.getExperience())
                .imageUrl(pet.getImageUrl())
                .premium(pet.isPremium())
                .equipped(userPet.isEquipped())
                .price(pet.getPrice())
                .rarity(pet.getRarity())
                .build();
    }

    @Override
    @Transactional
    public UserPetSummaryResponse addPetFromStore(Long petId, Long userId) {
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PET_NOT_FOUND));

        if (!pet.isActive()) {
            throw new BusinessException(ErrorCode.PET_NOT_FOUND);
        }

        if (userPetRepository.existsByUserIdAndPetId(userId, petId)) {
            throw new BusinessException(ErrorCode.USER_PET_ALREADY_EXISTS);
        }

        pointService.debitWallet(
                userId,
                pet.getPrice(),
                PointTransactionType.PET_PURCHASE,
                "Pet purchase: " + pet.getCode(),
                String.valueOf(pet.getId())
        );

        User user = userService.findById(userId);

        UserPet userPet = UserPet.builder()
                .user(user)
                .pet(pet)
                .customName(pet.getName())
                .level(1)
                .experience(0)
                .equipped(false)
                .isDefault(false)
                .build();

        try {
            userPet = userPetRepository.save(userPet);
        } catch (DataIntegrityViolationException ex) {
            if (userPetRepository.existsByUserIdAndPetId(userId, petId)) {
                throw new BusinessException(ErrorCode.USER_PET_ALREADY_EXISTS);
            }
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Failed to add pet from store", ex);
        }

        return UserPetSummaryResponse.builder()
                .userPetId(userPet.getId())
                .code(pet.getCode())
                .customName(userPet.getCustomName())
                .level(userPet.getLevel())
                .experience(userPet.getExperience())
                .imageUrl(pet.getImageUrl())
                .premium(pet.isPremium())
                .equipped(userPet.isEquipped())
                .price(pet.getPrice())
                .rarity(pet.getRarity())
                .build();
    }

    @Override
    @Transactional
    public UserPetSummaryResponse equipUserPet(Long userPetId, Long userId) {
        List<UserPet> userPets = userPetRepository.findAllByUserIdWithPet(userId);

        UserPet selectedUserPet = userPets.stream()
                .filter(userPet -> userPet.getId().equals(userPetId))
                .findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_PET_NOT_FOUND));

        userPets.forEach(userPet -> userPet.setEquipped(userPet.getId().equals(userPetId)));
        userPetRepository.saveAll(userPets);

        Pet pet = selectedUserPet.getPet();

        return UserPetSummaryResponse.builder()
                .userPetId(selectedUserPet.getId())
                .code(pet.getCode())
                .customName(selectedUserPet.getCustomName())
                .level(selectedUserPet.getLevel())
                .experience(selectedUserPet.getExperience())
                .imageUrl(pet.getImageUrl())
                .premium(pet.isPremium())
                .equipped(selectedUserPet.isEquipped())
                .price(pet.getPrice())
                .rarity(pet.getRarity())
                .build();
    }

    @Override
    @Transactional
    public UserPetSummaryResponse upgradeUserPet(Long userPetId, Long userId) {
        UserPet userPet = userPetRepository.findByIdWithPet(userPetId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_PET_NOT_FOUND));

        if (!userPet.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.USER_PET_NOT_FOUND);
        }

        if (userPet.getLevel() >= MAX_PET_LEVEL) {
            throw new BusinessException(ErrorCode.USER_PET_MAX_LEVEL_REACHED);
        }

        if (userPet.getExperience() < XP_PER_LEVEL) {
            throw new BusinessException(ErrorCode.USER_PET_INSUFFICIENT_EXPERIENCE);
        }

        userPet.setLevel(userPet.getLevel() + 1);
        userPet.setExperience(userPet.getExperience() - XP_PER_LEVEL);
        userPetRepository.save(userPet);

        Pet pet = userPet.getPet();

        return UserPetSummaryResponse.builder()
                .userPetId(userPet.getId())
                .code(pet.getCode())
                .customName(userPet.getCustomName())
                .level(userPet.getLevel())
                .experience(userPet.getExperience())
                .imageUrl(pet.getImageUrl())
                .premium(pet.isPremium())
                .equipped(userPet.isEquipped())
                .price(pet.getPrice())
                .rarity(pet.getRarity())
                .build();
    }

}
