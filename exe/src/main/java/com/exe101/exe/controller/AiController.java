package com.exe101.exe.controller;

import com.exe101.exe.service.AiCloudService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiController {
    private final AiCloudService aiCloudService;

    @PostMapping("/chat")
    public String testChat(@RequestBody AiTestRequest request) {

        return aiCloudService.requestAiSpeech(
                request.systemPrompt(),
                request.userPrompt()
        );
    }

    public record AiTestRequest(
            String systemPrompt,
            String userPrompt
    ) {}
}
