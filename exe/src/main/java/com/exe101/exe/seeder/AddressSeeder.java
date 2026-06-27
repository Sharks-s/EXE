package com.exe101.exe.seeder;

import com.exe101.exe.dto.response.ProvinceApiResponse.ProvinceDto;
import com.exe101.exe.dto.response.ProvinceApiResponse.WardDto;
import com.exe101.exe.model.entity.Province;
import com.exe101.exe.model.entity.Ward;
import com.exe101.exe.repository.ProvinceRepository;
import com.exe101.exe.repository.WardRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Objects;

@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class AddressSeeder implements ApplicationRunner {

    private static final String BASE_URL = "https://provinces.open-api.vn/api/v2";

    private final ProvinceRepository provinceRepository;
    private final WardRepository wardRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public void run(ApplicationArguments args) {
        if (provinceRepository.count() > 0) {
            log.info("Address data already seeded");
            return;
        }

        ProvinceDto[] provinceDtos;

        try {
            provinceDtos = restTemplate.getForObject(
                    BASE_URL + "/p/",
                    ProvinceDto[].class
            );
        } catch (Exception ex) {
            log.warn("Failed to fetch provinces", ex);
            return;
        }

        for (ProvinceDto provinceDto : Objects.requireNonNullElse(provinceDtos, new ProvinceDto[0])) {
            seedProvinceWithWards(provinceDto);
            sleepAfterRequest();
        }

        log.info("Address data seeded successfully");
    }

    private void seedProvinceWithWards(ProvinceDto provinceDto) {
        Province province;

        try {
            province = provinceRepository.save(toProvince(provinceDto));
        } catch (Exception ex) {
            log.warn("Failed to save province {}", provinceDto.getCode(), ex);
            return;
        }

        ProvinceDto provinceDetail;

        try {
            provinceDetail = restTemplate.getForObject(
                    BASE_URL + "/p/" + provinceDto.getCode() + "?depth=2",
                    ProvinceDto.class
            );
        } catch (Exception ex) {
            log.warn("Failed to fetch wards for province {}", provinceDto.getCode(), ex);
            return;
        }

        List<WardDto> wardDtos = provinceDetail == null ? List.of() : provinceDetail.getWards();

        if (wardDtos == null || wardDtos.isEmpty()) {
            return;
        }

        try {
            wardRepository.saveAll(
                    wardDtos.stream()
                            .map(wardDto -> toWard(wardDto, province))
                            .toList()
            );
        } catch (Exception ex) {
            log.warn("Failed to save wards for province {}", provinceDto.getCode(), ex);
        }
    }

    private Province toProvince(ProvinceDto provinceDto) {
        return Province.builder()
                .code(provinceDto.getCode())
                .name(provinceDto.getName())
                .codeName(provinceDto.getCodeName())
                .build();
    }

    private Ward toWard(WardDto wardDto, Province province) {
        return Ward.builder()
                .code(wardDto.getCode())
                .name(wardDto.getName())
                .codeName(wardDto.getCodeName())
                .province(province)
                .build();
    }

    private void sleepAfterRequest() {
        try {
            Thread.sleep(100);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            log.warn("Address seeding interrupted while throttling requests", ex);
        }
    }
}