package com.exe101.exe.service;

import com.exe101.exe.config.AiCloudProperties;
import com.exe101.exe.dto.request.AiChatRequest;
import com.exe101.exe.dto.request.AiMessage;
import com.exe101.exe.dto.response.AiChatResponse;
import com.exe101.exe.model.entity.AiLog;
import com.exe101.exe.model.enums.AiCallStatus;
import com.exe101.exe.model.enums.JsonParseStatus;
import com.exe101.exe.repository.AiLogRepository;
import com.exe101.exe.service.result.AiCallResult;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.util.List;

@Service
public class AiCloudService {

    private static final String PROVIDER = "OPENROUTER";
    private static final ThreadLocal<Long> LAST_LOG_ID = new ThreadLocal<>();

    private final RestClient restClient;
    private final AiCloudProperties aiCloudProperties;
    private final AiLogRepository aiLogRepository;

    public AiCloudService(AiCloudProperties aiCloudProperties, AiLogRepository aiLogRepository) {
        this.aiCloudProperties = aiCloudProperties;
        this.aiLogRepository = aiLogRepository;

        this.restClient = RestClient.builder()
                .baseUrl(aiCloudProperties.getBaseUrl())
                .defaultHeader("Authorization", "Bearer " + aiCloudProperties.getApiKey())
                .defaultHeader("HTTP-Referer", "http://localhost:8080")
                .build();
    }

    public String requestAiSpeech(String systemPrompt, String userPrompt) {
        AiCallResult result = requestAiSpeechWithLog(inferFeatureFromCaller(), null, systemPrompt, userPrompt);
        LAST_LOG_ID.set(result.logId());
        markJsonParseStatus(result.logId(), JsonParseStatus.NOT_JSON, null);
        return result.content();
    }

    public Long getLastLogId() {
        return LAST_LOG_ID.get();
    }

    public AiCallResult requestAiSpeechWithLog(String feature, String promptName, String systemPrompt, String userPrompt) {
        long startedAt = System.currentTimeMillis();
        AiLog log = AiLog.builder()
                .provider(PROVIDER)
                .model(aiCloudProperties.getModel())
                .feature(feature)
                .promptName(promptName)
                .status(AiCallStatus.FAILED)
                .build();

        try {
            AiChatRequest requestBody = new AiChatRequest(
                    aiCloudProperties.getModel(),
                    List.of(
                            new AiMessage("system", systemPrompt),
                            new AiMessage("user", userPrompt)
                    ),
                    0.7,
                    aiCloudProperties.getMaxTokens()
            );

            AiChatResponse response = restClient.post()
                    .uri("/chat/completions")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(AiChatResponse.class);

            log.setLatencyMs(System.currentTimeMillis() - startedAt);
            log.setStatus(AiCallStatus.SUCCESS);
            if (response != null && response.usage() != null) {
                log.setInputTokens(response.usage().promptTokens());
                log.setOutputTokens(response.usage().completionTokens());
                log.setTotalTokens(response.usage().totalTokens());
            }

            String content = null;
            if (response != null && response.choices() != null && !response.choices().isEmpty()) {
                content = response.choices().get(0).message().content().trim();
            }

            AiLog savedLog = aiLogRepository.save(log);
            return new AiCallResult(savedLog.getId(), content);
        } catch (Exception e) {
            log.setLatencyMs(System.currentTimeMillis() - startedAt);
            log.setStatus(AiCallStatus.FAILED);
            log.setErrorMessage(truncate(e.getMessage(), 4000));
            AiLog savedLog = aiLogRepository.save(log);
            System.err.println("[AiCloudService] Loi goi AI Cloud: " + e.getMessage());
            return new AiCallResult(savedLog.getId(), null);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markJsonParseStatus(Long logId, JsonParseStatus status, String errorMessage) {
        if (logId == null || status == null) {
            return;
        }
        aiLogRepository.findById(logId).ifPresent(log -> {
            log.setJsonParseStatus(status);
            log.setJsonParseError(truncate(errorMessage, 4000));
            aiLogRepository.save(log);
        });
    }

    private String truncate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }

    private String inferFeatureFromCaller() {
        for (StackTraceElement element : Thread.currentThread().getStackTrace()) {
            String className = element.getClassName();
            if (className.endsWith("FocusSessionServiceImpl")) {
                return "CLASSIFY_APP";
            }
            if (className.endsWith("AiController")) {
                return "AI_TEST";
            }
        }
        return "UNKNOWN";
    }
}
