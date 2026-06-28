package com.exe101.exe.dto.request;

import com.exe101.exe.model.enums.UserGender;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CompleteBasicProfileRequest(
        @NotBlank(message = "{validation.userProfile.name.notBlank}")
        @Size(max = 100, message = "{validation.userProfile.name.size}")
        String fullName,
        UserGender gender,

        LocalDate dateOfBirth,

        Long personalityId,

        @Pattern(
                regexp = "^(0|\\+84)(3|5|7|8|9)[0-9]{8}$",
                message = "{validation.userProfile.phoneNumber.invalid}"
        )
        String phoneNumber,

        @NotBlank(message = "{validation.userProfile.addressLine.notBlank}")
        @Size(max = 255, message = "{validation.userProfile.addressLine.size}")
        String addressLine,

        @NotNull(message = "{validation.userProfile.provinceCode.notNull}")
        Integer provinceCode,

        @NotNull(message = "{validation.userProfile.wardCode.notNull}")
        Integer wardCode

) {}
