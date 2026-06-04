package com.exe101.exe.dto.request;


import com.exe101.exe.model.enums.OtpType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record VerifyRegisterRequest(

        @Schema(minLength = 1)
        @NotBlank(message = "{validation.otp.notBlank}")
        @Pattern(
                regexp = "^\\d{6}$",
                message = "{validation.otp.invalid}"
        )
        String otp,

        @NotBlank(message = "{validation.verifyId.notBlank}")
        @Size(min=1, max = 36, message = "{validation.verifyId.size}")
        String verifyId,

        @NotNull(message = "{validation.otp.type.notBlank}")
        OtpType type

) {}
