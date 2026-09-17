package com.exe101.exe.service.impl;

import com.exe101.exe.dto.response.AdminActiveSubscriptionItem;
import com.exe101.exe.dto.response.AdminSubscriptionStatsResponse;
import com.exe101.exe.dto.response.AdminTransactionItem;
import com.exe101.exe.dto.response.PagedResponse;
import com.exe101.exe.model.entity.Subscription;
import com.exe101.exe.model.entity.Transaction;
import com.exe101.exe.model.enums.PaymentProvider;
import com.exe101.exe.model.enums.TransactionStatus;
import com.exe101.exe.repository.SubscriptionRepository;
import com.exe101.exe.repository.TransactionRepository;
import com.exe101.exe.service.AdminSubscriptionService;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminSubscriptionServiceImpl implements AdminSubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final TransactionRepository transactionRepository;

    @Override
    public AdminSubscriptionStatsResponse getStats(int days) {
        int safeDays = Math.min(Math.max(1, days), 365);
        Instant now = Instant.now();
        Instant from = now.minus(safeDays, ChronoUnit.DAYS);

        long paidTransactions = transactionRepository.countByStatusAndCreatedAtGreaterThanEqual(TransactionStatus.SUCCESS, from);
        Long revenue = transactionRepository.sumAmountByStatusSince(TransactionStatus.SUCCESS, from);

        return new AdminSubscriptionStatsResponse(
                subscriptionRepository.countActivePremium(now),
                subscriptionRepository.countActivePremiumByBillingCycle("MONTHLY", now),
                subscriptionRepository.countActivePremiumByBillingCycle("YEARLY", now),
                revenue == null ? 0L : revenue,
                paidTransactions
        );
    }

    @Override
    public PagedResponse<AdminActiveSubscriptionItem> getActiveSubscriptions(String keyword, int page, int size) {
        Page<Subscription> result = subscriptionRepository.searchActiveSubscriptions(
                normalize(keyword),
                Instant.now(),
                PageRequest.of(safePage(page), safeSize(size), Sort.by(Sort.Direction.DESC, "createdAt"))
        );

        return new PagedResponse<>(
                result.getContent().stream().map(this::toActiveItem).toList(),
                result.getNumber(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.hasNext()
        );
    }

    @Override
    public PagedResponse<AdminTransactionItem> getTransactions(
            String keyword,
            TransactionStatus status,
            PaymentProvider provider,
            Instant from,
            Instant to,
            int page,
            int size
    ) {
        Page<Transaction> result = transactionRepository.findAll(
                buildTransactionSpecification(normalize(keyword), status, provider, from, to),
                PageRequest.of(safePage(page), safeSize(size), Sort.by(Sort.Direction.DESC, "createdAt"))
        );

        return new PagedResponse<>(
                result.getContent().stream().map(this::toTransactionItem).toList(),
                result.getNumber(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.hasNext()
        );
    }

    private AdminActiveSubscriptionItem toActiveItem(Subscription subscription) {
        return new AdminActiveSubscriptionItem(
                subscription.getId(),
                subscription.getUser().getId(),
                subscription.getUser().getEmail(),
                subscription.getUser().getFullName(),
                subscription.getPlan(),
                subscription.getBillingCycle(),
                subscription.getStartedAt(),
                subscription.getExpiresAt(),
                subscription.isActive(),
                subscription.getCreatedAt()
        );
    }

    private AdminTransactionItem toTransactionItem(Transaction transaction) {
        return new AdminTransactionItem(
                transaction.getId(),
                transaction.getUser().getId(),
                transaction.getUser().getEmail(),
                transaction.getUser().getFullName(),
                transaction.getOrderCode(),
                transaction.getPlan(),
                transaction.getAmount(),
                transaction.getProvider(),
                transaction.getStatus(),
                transaction.getProviderTransactionId(),
                transaction.getSubscription() == null ? null : transaction.getSubscription().getId(),
                transaction.getPaidAt(),
                transaction.getCreatedAt(),
                transaction.getUpdatedAt()
        );
    }

    private int safePage(int page) {
        return Math.max(0, page);
    }

    private int safeSize(int size) {
        return Math.min(Math.max(1, size), 100);
    }

    private String normalize(String keyword) {
        return keyword == null ? null : keyword.trim();
    }

    private Specification<Transaction> buildTransactionSpecification(
            String keyword,
            TransactionStatus status,
            PaymentProvider provider,
            Instant from,
            Instant to
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (keyword != null && !keyword.isBlank()) {
                var user = root.join("user", JoinType.INNER);
                String pattern = "%" + keyword.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("orderCode").as(String.class)), pattern),
                        cb.like(cb.lower(user.get("email").as(String.class)), pattern),
                        cb.like(cb.lower(user.get("fullName").as(String.class)), pattern),
                        cb.like(cb.lower(root.get("providerTransactionId").as(String.class)), pattern)
                ));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (provider != null) {
                predicates.add(cb.equal(root.get("provider"), provider));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), to));
            }

            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }
}
