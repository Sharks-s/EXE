package com.exe101.exe.service.impl;

import com.exe101.exe.config.AppSeedProperties;
import com.exe101.exe.dto.response.SubscriptionResponse;
import com.exe101.exe.dto.response.SubscriptionPlanResponse;
import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.model.entity.Subscription;
import com.exe101.exe.model.entity.SubscriptionPlan;
import com.exe101.exe.model.entity.User;
import com.exe101.exe.repository.SubscriptionRepository;
import com.exe101.exe.repository.SubscriptionPlanRepository;
import com.exe101.exe.repository.UserRepository;
import com.exe101.exe.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class SubscriptionServiceImpl implements SubscriptionService {

    private final AppSeedProperties appSeedProperties;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void seedDefaultSubscriptionPlans() {
        if (appSeedProperties.getSubscriptionPlans() == null) {
            log.warn("No subscription plans configured under app.seed.subscription-plans");
            return;
        }

        for (AppSeedProperties.SubscriptionPlanSeed seed : appSeedProperties.getSubscriptionPlans()) {
            log.info("Seeding subscription plan: {}", seed.getCode());

            SubscriptionPlan plan = subscriptionPlanRepository.findByCode(seed.getCode())
                    .orElseGet(SubscriptionPlan::new);

            plan.setCode(seed.getCode());
            plan.setName(seed.getName());
            plan.setDescription(seed.getDescription());
            plan.setPlan(seed.getPlan());
            plan.setBillingCycle(seed.getBillingCycle());
            plan.setPriceVnd(seed.getPriceVnd());
            plan.setDurationDays(seed.getDurationDays());
            plan.setDailyLimitMinutes(seed.getDailyLimitMinutes());
            plan.setUnlimitedUsage(seed.isUnlimitedUsage());
            plan.setActive(seed.isActive());
            plan.setDisplayOrder(seed.getDisplayOrder() != null ? seed.getDisplayOrder() : 0);

            subscriptionPlanRepository.save(plan);
        }

        log.info("Subscription plan seed completed. configuredPlans={}", appSeedProperties.getSubscriptionPlans().size());
    }

    @Override
    public List<SubscriptionPlanResponse> getActivePlans() {
        return subscriptionPlanRepository.findByActiveTrueOrderByDisplayOrderAscIdAsc()
                .stream()
                .sorted(Comparator.comparing(SubscriptionPlan::getDisplayOrder).thenComparing(SubscriptionPlan::getId))
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public SubscriptionResponse upgradeToPro(Long userId, String planCode) {
        SubscriptionPlan plan = subscriptionPlanRepository.findByCode(planCode)
                .filter(SubscriptionPlan::isActive)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Subscription plan not found"));

        if (!"PRO".equalsIgnoreCase(plan.getPlan())) {
            throw new BusinessException(ErrorCode.BUSINESS_ERROR, "Only PRO plans can be activated with this endpoint");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_ID_NOT_FOUND));

        Instant now = Instant.now();
        subscriptionRepository.findByUserIdAndIsActiveTrue(userId).forEach(activeSubscription -> {
            activeSubscription.setActive(false);
            if (activeSubscription.getExpiresAt() == null || activeSubscription.getExpiresAt().isAfter(now)) {
                activeSubscription.setExpiresAt(now);
            }
            subscriptionRepository.save(activeSubscription);
        });

        Instant expiresAt = plan.getDurationDays() != null
                ? now.plusSeconds(plan.getDurationDays() * 24L * 60L * 60L)
                : null;

        Subscription subscription = subscriptionRepository.save(Subscription.builder()
                .user(user)
                .plan(plan.getPlan())
                .billingCycle(plan.getBillingCycle())
                .startedAt(now)
                .expiresAt(expiresAt)
                .isActive(true)
                .build());

        return toSubscriptionResponse(subscription);
    }

    private SubscriptionPlanResponse toResponse(SubscriptionPlan plan) {
        return SubscriptionPlanResponse.builder()
                .id(plan.getId())
                .code(plan.getCode())
                .name(plan.getName())
                .description(plan.getDescription())
                .plan(plan.getPlan())
                .billingCycle(plan.getBillingCycle())
                .priceVnd(plan.getPriceVnd())
                .durationDays(plan.getDurationDays())
                .dailyLimitMinutes(plan.getDailyLimitMinutes())
                .unlimitedUsage(plan.isUnlimitedUsage())
                .active(plan.isActive())
                .build();
    }

    private SubscriptionResponse toSubscriptionResponse(Subscription subscription) {
        boolean unlimited = "PRO".equalsIgnoreCase(subscription.getPlan())
                || "PREMIUM".equalsIgnoreCase(subscription.getPlan());

        return SubscriptionResponse.builder()
                .id(subscription.getId())
                .plan(subscription.getPlan())
                .billingCycle(subscription.getBillingCycle())
                .startedAt(subscription.getStartedAt())
                .expiresAt(subscription.getExpiresAt())
                .active(subscription.isActive())
                .unlimited(unlimited)
                .build();
    }
}
