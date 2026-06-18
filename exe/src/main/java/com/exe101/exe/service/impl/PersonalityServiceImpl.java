package com.exe101.exe.service.impl;

import com.exe101.exe.config.AppSeedProperties;
import com.exe101.exe.dto.request.CreatePersonalityRequest;
import com.exe101.exe.dto.request.UpdatePersonalityRequest;
import com.exe101.exe.dto.response.PersonalityDetailsResponse;
import com.exe101.exe.dto.response.PersonalityResponse;
import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.mapper.PersonalityMapper;
import com.exe101.exe.model.entity.Personality;
import com.exe101.exe.repository.PersonalityRepository;
import com.exe101.exe.service.PersonalityService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PersonalityServiceImpl implements PersonalityService {

    private final PersonalityRepository personalityRepository;
    private final PersonalityMapper personalityMapper;
    private final AppSeedProperties appSeedProperties;

    @Override
    public List<PersonalityResponse> getAll() {
        return personalityRepository.findAll()
                .stream()
                .map(personalityMapper::toResponse)
                .toList();
    }

    @Override
    public PersonalityResponse getByCode(String code) {
        return personalityRepository.findByCode(code)
                .map(personalityMapper::toResponse)
                .orElseThrow(() -> new BusinessException(ErrorCode.PERSONALITY_NOT_FOUND));
    }

    @Override
    @Transactional
    public void seedDefaultPersonalities() {
        // Bảo vệ dữ liệu: Chỉ chạy nếu list cấu hình trong yml không trống
        if (appSeedProperties.getPersonalities() == null) return;

        // Lặp qua danh sách đọc được từ file yml
        for (AppSeedProperties.PersonalitySeed seed : appSeedProperties.getPersonalities()) {

            // Nếu tính cách này đã tồn tại dưới DB rồi (isPresent) thì bỏ qua
            if (personalityRepository.findByCode(seed.getCode()).isPresent()) {
                continue;
            }

            // Nếu chưa có thì tiến hành save mới
            Personality p = Personality.builder()
                    .code(seed.getCode())
                    .name(seed.getName())
                    .description(seed.getDescription())
                    .isPremium(seed.isPremium())
                    .createdAt(Instant.now())
                    .build();

            personalityRepository.save(p);
        }
    }

    @Override
    public PersonalityResponse getById(Long id) {
        return personalityRepository.findById(id)
                .map(personalityMapper::toResponse)
                .orElseThrow(() -> new BusinessException(ErrorCode.PERSONALITY_NOT_FOUND));
    }

    @Override
    @Transactional
    public PersonalityResponse create(CreatePersonalityRequest request) {
        if (personalityRepository.existsByCode(request.code())) {
            throw new BusinessException(ErrorCode.PERSONALITY_CODE_ALREADY_EXISTS);
        }

        Personality personality = Personality.builder()
                .code(request.code())
                .name(request.name())
                .description(request.description())
                .isPremium(request.isPremium())
                .build();

        return personalityMapper.toResponse(personalityRepository.save(personality));
    }

    @Override
    @Transactional
    public PersonalityResponse update(Long id, UpdatePersonalityRequest request) {
        Personality personality = personalityRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.PERSONALITY_NOT_FOUND));

        if (personalityRepository.existsByCodeAndIdNot(request.code(), id)) {
            throw new BusinessException(ErrorCode.PERSONALITY_CODE_ALREADY_EXISTS);
        }

        personality.setCode(request.code());
        personality.setName(request.name());
        personality.setDescription(request.description());
        personality.setPremium(request.isPremium());

        return personalityMapper.toResponse(personalityRepository.save(personality));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!personalityRepository.existsById(id)) {
            throw new BusinessException(ErrorCode.PERSONALITY_NOT_FOUND);
        }

        personalityRepository.deleteById(id);
    }

    @Override
    public PersonalityDetailsResponse getDetails(Long personalityId) {
        Personality personality = personalityRepository.findById(personalityId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PERSONALITY_NOT_FOUND));

        return PersonalityDetailsResponse.builder()
                .id(personality.getId())
                .name(personality.getName())
                .code(personality.getCode())
                .build();
    }

}
