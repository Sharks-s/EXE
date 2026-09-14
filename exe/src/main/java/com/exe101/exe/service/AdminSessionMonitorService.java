package com.exe101.exe.service;

import com.exe101.exe.dto.response.AdminSessionMonitorItem;

import java.util.List;

public interface AdminSessionMonitorService {
    List<AdminSessionMonitorItem> getActiveSessions();
}