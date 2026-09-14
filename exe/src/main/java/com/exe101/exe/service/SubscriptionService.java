package com.exe101.exe.service;

import com.exe101.exe.dto.response.SubscriptionResponse;
import com.exe101.exe.dto.response.SubscriptionPlanResponse;

import java.util.List;

public interface SubscriptionService {
    void seedDefaultSubscriptionPlans();

    List<SubscriptionPlanResponse> getActivePlans();

    SubscriptionResponse upgradeToPro(Long userId, String planCode);
}
