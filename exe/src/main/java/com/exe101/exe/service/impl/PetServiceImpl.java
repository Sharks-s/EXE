package com.exe101.exe.service.impl;

import com.exe101.exe.config.AppSeedProperties;
import com.exe101.exe.dto.response.PetResponse;
import com.exe101.exe.model.entity.Pet;
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
                        .build())
                .toList();
    }
}
