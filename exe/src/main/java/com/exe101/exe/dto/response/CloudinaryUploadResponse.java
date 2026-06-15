package com.exe101.exe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CloudinaryUploadResponse {
    private String url;
    private String publicId;
}