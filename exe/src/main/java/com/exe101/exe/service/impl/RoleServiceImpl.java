package com.exe101.exe.service.impl;


import com.exe101.exe.exception.BusinessException;
import com.exe101.exe.exception.ErrorCode;
import com.exe101.exe.model.entity.Role;
import com.exe101.exe.repository.RoleRepository;
import com.exe101.exe.service.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class RoleServiceImpl implements RoleService {
    private final RoleRepository roleRepository;

    @Override
    public Role getByCode(String code) {
        return roleRepository.findByCode(code)
                .orElseThrow(() -> new BusinessException(ErrorCode.ROLE_NOT_FOUND));
    }
}
