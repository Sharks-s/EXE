package com.exe101.exe.service.impl;

import com.exe101.exe.config.AppSeedProperties;
import com.exe101.exe.dto.request.CreateAppRuleRequest;
import com.exe101.exe.dto.response.AppRuleResponse;
import com.exe101.exe.dto.response.AppRulesResponse;
import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.model.entity.AppRule;
import com.exe101.exe.model.entity.User;
import com.exe101.exe.model.enums.RuleType;
import com.exe101.exe.repository.AppRuleRepository;
import com.exe101.exe.service.AppRuleService;
import com.exe101.exe.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.function.Consumer;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AppRuleServiceImpl implements AppRuleService {

    private final AppSeedProperties appSeedProperties;
    private final AppRuleRepository appRuleRepository;
    private final UserService userService;

    @Override
    @Transactional
    public void seedDefaultAppRules() {
        if (appSeedProperties.getAppRules() == null) return;

        for (AppSeedProperties.AppRuleSeed seed : appSeedProperties.getAppRules()) {
            String appName = seed.getAppName() != null ? seed.getAppName().trim() : null;
            String windowTitleKeyword = seed.getWindowTitleKeyword() != null ? seed.getWindowTitleKeyword().trim() : null;

            if (appRuleRepository.existsByUserIsNullAndAppNameAndWindowTitleKeywordAndRuleType(
                    appName,
                    windowTitleKeyword,
                    seed.getRuleType()
            )) {
                continue;
            }

            AppRule appRule = AppRule.builder()
                    .user(null)
                    .appName(appName)
                    .windowTitleKeyword(windowTitleKeyword)
                    .ruleType(seed.getRuleType())
                    .build();

            appRuleRepository.save(appRule);
        }
    }

    @Override
    public List<AppRuleResponse> getMyRules(Long userId) {
        return appRuleRepository.findByUserId(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public AppRuleResponse createRule(Long userId, CreateAppRuleRequest request) {
        User user = userService.findById(userId);

        String keyword = request.keyword().toLowerCase().trim();

        if (appRuleRepository.existsByUserIdAndWindowTitleKeywordAndRuleType(userId, keyword, request.ruleType())) {
            throw new BusinessException(ErrorCode.APP_RULE_ALREADY_EXISTS);
        }

        AppRule rule = AppRule.builder()
                .user(user)
                .appName(null)
                .windowTitleKeyword(keyword)
                .ruleType(request.ruleType())
                .build();

        return toResponse(appRuleRepository.save(rule));
    }

    @Override
    @Transactional
    public void deleteRule(Long userId, Long ruleId) {
        AppRule rule = appRuleRepository.findByIdAndUserId(ruleId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.APP_RULE_NOT_FOUND));

        appRuleRepository.delete(rule);
    }

    private AppRuleResponse toResponse(AppRule rule) {
        String keyword = rule.getWindowTitleKeyword() != null
                ? rule.getWindowTitleKeyword()
                : rule.getAppName();

        return AppRuleResponse.builder()
                .id(rule.getId())
                .keyword(keyword)
                .ruleType(rule.getRuleType())
                .build();
    }

    @Override
    public AppRulesResponse getRulesForUserSession(Long userId) {
        // 1. Tải song song luật hệ thống và luật riêng từ DB
        List<AppRule> globalRules = appRuleRepository.findByUserIsNull();
        List<AppRule> userSpecificRules = appRuleRepository.findByUserId(userId);

        Set<String> blacklist = new HashSet<>();
        Set<String> whitelist = new HashSet<>();

        // 2. Hàm gom chữ dùng chung (Chuẩn hóa chữ thường để FE so sánh .includes dễ dàng)
        Consumer<AppRule> processRule = rule -> {
            String keyword = rule.getWindowTitleKeyword() != null ? rule.getWindowTitleKeyword() : rule.getAppName();
            if (keyword != null && !keyword.isBlank()) {
                keyword = keyword.toLowerCase().trim();
                if (rule.getRuleType() == RuleType.BLACKLIST) {
                    blacklist.add(keyword);
                } else if (rule.getRuleType() == RuleType.WHITELIST) {
                    whitelist.add(keyword);
                }
            }
        };

        // 3. Đổ dữ liệu vào Set (HashSet tự động loại bỏ trùng lặp nếu User cấu hình trùng với hệ thống)
        globalRules.forEach(processRule);
        userSpecificRules.forEach(processRule);

        return new AppRulesResponse(blacklist, whitelist);
    }

    @Override
    public List<AppRuleResponse> adminGetGlobalRules() {
        return appRuleRepository.findByUserIsNull()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public AppRuleResponse adminCreateGlobalRule(CreateAppRuleRequest request) {
        String keyword = request.keyword().toLowerCase().trim();

        if (appRuleRepository.existsByUserIsNullAndWindowTitleKeywordAndRuleType(keyword, request.ruleType())) {
            throw new BusinessException(ErrorCode.APP_RULE_ALREADY_EXISTS);
        }

        AppRule rule = AppRule.builder()
                .user(null)
                .appName(null)
                .windowTitleKeyword(keyword)
                .ruleType(request.ruleType())
                .build();

        return toResponse(appRuleRepository.save(rule));
    }

    @Override
    @Transactional
    public void adminDeleteGlobalRule(Long ruleId) {
        AppRule rule = appRuleRepository.findByIdAndUserIsNull(ruleId)
                .orElseThrow(() -> new BusinessException(ErrorCode.APP_RULE_NOT_FOUND));

        appRuleRepository.delete(rule);
    }
}
