package com.exe101.exe.service;

import com.exe101.exe.model.entity.Role;

public interface RoleService {
    Role getByCode(String code);
}