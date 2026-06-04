package com.exe101.exe.service;


import com.exe101.exe.model.entity.User;

public interface UserRoleService {

    void assignRole(User user, String roleCode);

    boolean hasRole(User user, String roleCode);
}