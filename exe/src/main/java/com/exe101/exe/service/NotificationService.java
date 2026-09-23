package com.exe101.exe.service;

import com.exe101.exe.dto.response.NotificationResponse;
import com.exe101.exe.dto.response.PagedResponse;
import com.exe101.exe.model.enums.NotificationType;

import java.util.Map;

public interface NotificationService {

    NotificationResponse create(
            Long userId,
            NotificationType type,
            String title,
            String message,
            String actionUrl,
            Map<String, Object> metadata
    );

    PagedResponse<NotificationResponse> getNotifications(Long userId, int page, int size);

    long getUnreadCount(Long userId);

    NotificationResponse markAsRead(Long userId, Long notificationId);

    void markAllAsRead(Long userId);

    void delete(Long userId, Long notificationId);
}
