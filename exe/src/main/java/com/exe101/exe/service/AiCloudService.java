package com.exe101.exe.service;

import com.exe101.exe.config.AiCloudProperties;
import com.exe101.exe.dto.request.AiChatRequest;
import com.exe101.exe.dto.request.AiMessage;
import com.exe101.exe.dto.response.AiChatResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import java.util.List;

@Service
public class AiCloudService {

    private final RestClient restClient;
    private final AiCloudProperties aiCloudProperties;

    // 🌟 Constructor bây giờ siêu ngắn gọn và sạch sẽ
    public AiCloudService(AiCloudProperties aiCloudProperties) {
        this.aiCloudProperties = aiCloudProperties;

        this.restClient = RestClient.builder()
                .baseUrl(aiCloudProperties.getBaseUrl())
                .defaultHeader("Authorization", "Bearer " + aiCloudProperties.getApiKey())
                .defaultHeader("HTTP-Referer", "http://localhost:8080")
                .build();
    }

    public String requestAiSpeech(String systemPrompt, String userPrompt) {
        try {
            AiChatRequest requestBody = new AiChatRequest(
                    aiCloudProperties.getModel(), // Lấy qua Properties thay vì biến cục bộ
                    List.of(
                            new AiMessage("system", systemPrompt),
                            new AiMessage("user", userPrompt)
                    ),
                    0.7
            );

            AiChatResponse response = restClient.post()
                    .uri("/chat/completions")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(AiChatResponse.class);

            if (response != null && response.choices() != null && !response.choices().isEmpty()) {
                return response.choices().get(0).message().content().trim();
            }

        } catch (Exception e) {
            System.err.println("[AiCloudService] Lỗi gọi AI Cloud: " + e.getMessage());
        }
        return null;
    }
}