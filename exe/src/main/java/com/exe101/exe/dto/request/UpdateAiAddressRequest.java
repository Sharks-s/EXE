package com.exe101.exe.dto.request;

import jakarta.validation.constraints.Size;

public record UpdateAiAddressRequest(
        @Size(max = 30) String aiSelfAddress,
        @Size(max = 30) String aiUserAddress
) {}
