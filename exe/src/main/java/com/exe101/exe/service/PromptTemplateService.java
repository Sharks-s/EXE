package com.exe101.exe.service;

import com.exe101.exe.dto.request.UpdatePromptTemplateRequest;
import com.exe101.exe.dto.response.PromptTemplateResponse;

import java.util.List;
import java.util.Map;

public interface PromptTemplateService {
    String render(String promptKey, Map<String, String> values);
    String renderWithPersona(String taskPromptKey, Map<String, String> values); // ghép PERSONA_HEADER + task
    void seedDefaultPromptTemplates();

    List<PromptTemplateResponse> adminGetAll();
    PromptTemplateResponse adminGetById(Long id);
    PromptTemplateResponse adminUpdate(Long id, UpdatePromptTemplateRequest request);
}