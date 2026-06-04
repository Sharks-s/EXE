package com.exe101.exe.service;


import com.exe101.exe.model.entity.User;

import java.util.Optional;

public interface UserService {
    User createLocalUser(String email);

    User activateUser(Long id);

    Optional<User> findByEmail(String email);

    User findByUsername(String username);

    User createOAuthUser(String email, String name, String avatarUrl);

    User updateOAuthUser(User user, String name, String avatarUrl);

    User findById(Long id);

    User getReferenceById(Long id);
    //User createByAdmin(CreateUserByAdminRequest request);
}