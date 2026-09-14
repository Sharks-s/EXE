package com.exe101.exe.repository;

import com.exe101.exe.model.entity.Role;
import com.exe101.exe.model.entity.User;
import com.exe101.exe.model.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRoleRepository extends JpaRepository<UserRole, Integer> {
    boolean existsByUserAndRole(User user, Role role);

    UserRole findByUserAndRole(User user, Role role);

    UserRole findByUserAndActiveTrue(User user);
}
