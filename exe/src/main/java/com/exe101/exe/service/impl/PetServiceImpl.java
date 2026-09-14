package com.exe101.exe.service.impl;

import com.exe101.exe.config.AppSeedProperties;
import com.exe101.exe.dto.request.UpdatePetRequest;
import com.exe101.exe.dto.response.AdminPetResponse;
import com.exe101.exe.dto.response.PetResponse;
import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.model.entity.Pet;
import com.exe101.exe.model.enums.PetRarity;
import com.exe101.exe.repository.PetRepository;
import com.exe101.exe.service.PetService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PetServiceImpl implements PetService {
    private final AppSeedProperties appSeedProperties;
    private final PetRepository petRepository;


    @Override
    @Transactional
    public void seedDefaultPets() {
        // Bảo vệ dữ liệu: Chỉ chạy nếu list cấu hình trong yml không trống
        if (appSeedProperties.getPets() == null) return;

        // Lặp qua danh sách đọc được từ file yml
        for (AppSeedProperties.PetSeed seed : appSeedProperties.getPets()) {

            // Nếu tính cách này đã tồn tại dưới DB rồi (isPresent) thì bỏ qua
            if (petRepository.findByCode(seed.getCode()).isPresent()) {
                continue;
            }

            // Nếu chưa có thì tiến hành save mới
            Pet p = Pet.builder()
                    .code(seed.getCode())
                    .name(seed.getName())
                    .description(seed.getDescription())
                    .premium(seed.isPremium())
                    .imageUrl(seed.getImageUrl())
                    .price(resolveSeedPrice(seed))
                    .rarity(resolveSeedRarity(seed))
                    .active(seed.getActive() == null || seed.getActive())
                    .createdAt(Instant.now())
                    .build();

            petRepository.save(p);
        }
    }

    @Override
    public List<PetResponse> getAll(Long userId) {
        return petRepository.findAllNotOwnedByUser(userId).stream()
                .map(pet -> PetResponse.builder()
                        .id(pet.getId())
                        .code(pet.getCode())
                        .name(pet.getName())
                        .description(pet.getDescription())
                        .imageUrl(pet.getImageUrl())
                        .premium(pet.isPremium())
                        .price(pet.getPrice())
                        .rarity(pet.getRarity())
                        .active(pet.isActive())
                        .build())
                .toList();
    }

    @Override
    public List<AdminPetResponse> adminGetAll() {
        return petRepository.findAll().stream()
                .map(this::toAdminResponse)
                .toList();
    }

    @Override
    public AdminPetResponse adminGetById(Long id) {
        Pet pet = petRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.PET_NOT_FOUND));
        return toAdminResponse(pet);
    }

    @Override
    @Transactional
    public AdminPetResponse adminUpdate(Long id, UpdatePetRequest request) {
        Pet pet = petRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.PET_NOT_FOUND));

        pet.setName(request.name());
        pet.setDescription(request.description());
        pet.setImageUrl(request.imageUrl());
        pet.setPremium(request.premium());
        pet.setPrice(request.price() != null ? request.price() : pet.getPrice());
        pet.setRarity(request.rarity() != null ? request.rarity() : pet.getRarity());
        pet.setActive(request.active() == null || request.active());

        return toAdminResponse(petRepository.save(pet));
    }

    private AdminPetResponse toAdminResponse(Pet pet) {
        return new AdminPetResponse(
                pet.getId(), pet.getCode(), pet.getName(),
                pet.getDescription(), pet.getImageUrl(), pet.isPremium(),
                pet.getPrice(), pet.getRarity(), pet.isActive()
        );
    }

    private Integer resolveSeedPrice(AppSeedProperties.PetSeed seed) {
        if (seed.getPrice() != null) {
            return seed.getPrice();
        }
        return seed.isPremium() ? 300 : 120;
    }

    private PetRarity resolveSeedRarity(AppSeedProperties.PetSeed seed) {
        if (seed.getRarity() != null) {
            return seed.getRarity();
        }
        return seed.isPremium() ? PetRarity.RARE : PetRarity.BASIC;
    }
}
