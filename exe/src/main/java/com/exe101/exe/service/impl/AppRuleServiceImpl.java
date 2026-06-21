package com.exe101.exe.service.impl;

import com.exe101.exe.dto.response.AppRulesResponse;
import com.exe101.exe.model.entity.AppRule;
import com.exe101.exe.model.enums.RuleType;
import com.exe101.exe.repository.AppRuleRepository;
import com.exe101.exe.service.AppRuleService;
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

    private final AppRuleRepository appRuleRepository;

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
}
