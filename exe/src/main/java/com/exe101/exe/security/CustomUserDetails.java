package com.exe101.exe.security;

import com.exe101.exe.model.entity.Role;
import com.exe101.exe.model.entity.User;
import com.exe101.exe.model.entity.UserIdentity;
import com.exe101.exe.model.entity.UserRole;
import com.exe101.exe.model.enums.UserStatus;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.stream.Collectors;

@Getter
@RequiredArgsConstructor
public class CustomUserDetails implements UserDetails {

    private final User user;
    private final UserIdentity userIdentity;


    public Long getId() {
        return user.getId();
    }

    @Override
    public String getUsername() {
        return user.getFullName();
    }

    @Override
    public String getPassword() {
        return userIdentity.getPassword();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return user.getUserRoles().stream()
                .filter(UserRole::isActive)
                .map(UserRole::getRole)
                .map(Role::getCode)
                .map(name -> new SimpleGrantedAuthority("ROLE_" + name))
                .collect(Collectors.toSet());
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return user.getStatus() != UserStatus.BLOCKED;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return user.getStatus() == UserStatus.ACTIVE;
    }
}