package com.exe101.exe.service.impl;


import com.exe101.exe.model.entity.Role;
import com.exe101.exe.model.entity.User;
import com.exe101.exe.model.entity.UserRole;
import com.exe101.exe.repository.UserRoleRepository;
import com.exe101.exe.service.RoleService;
import com.exe101.exe.service.UserRoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;


@Service
@RequiredArgsConstructor
public class UserRoleServiceImpl implements UserRoleService {

    private final UserRoleRepository userRoleRepository;
    private final RoleService roleService;

    @Override
    @Transactional
    public void assignRole(User user, String roleCode) {

        Role role = roleService.getByCode(roleCode);

        boolean exists = userRoleRepository
                .existsByUserAndRole(user, role);

        if (exists) return;

        userRoleRepository.save(
                UserRole.builder()
                        .user(user)
                        .role(role)
                        .active(true)
                        .assignedAt(Instant.now())
                        .build()
        );
    }

    @Override
    public boolean hasRole(User user, String roleCode) {
        return false;
    }
}