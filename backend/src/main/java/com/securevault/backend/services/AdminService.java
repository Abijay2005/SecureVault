package com.securevault.backend.services;

import com.securevault.backend.entity.User;
import com.securevault.backend.repository.CredentialRepository;
import com.securevault.backend.repository.SecurityEventRepository;
import com.securevault.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final CredentialRepository credentialRepository;
    private final SecurityEventRepository securityEventRepository;
    private final CacheService cacheService;

    public AdminService(UserRepository userRepository,
                        CredentialRepository credentialRepository,
                        SecurityEventRepository securityEventRepository,
                        CacheService cacheService) {
        this.userRepository = userRepository;
        this.credentialRepository = credentialRepository;
        this.securityEventRepository = securityEventRepository;
        this.cacheService = cacheService;
    }

    public void verifyAdminRole(User user) {
        if (user == null || !"ADMINISTRATOR".equalsIgnoreCase(user.getRole())) {
            throw new RuntimeException("Access Denied: Administrator role required for this action");
        }
    }

    public List<User> getAllUsers(User adminUser) {
        verifyAdminRole(adminUser);
        return userRepository.findAll();
    }

    public User updateUserRole(User adminUser, Long targetUserId, String newRole) {
        verifyAdminRole(adminUser);
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        target.setRole(newRole.toUpperCase());
        User saved = userRepository.save(target);

        // Invalidate admin cache and target user cache
        cacheService.invalidateAdminStats();
        cacheService.invalidateUserCache(targetUserId);

        return saved;
    }

    public Map<String, Object> getSystemStats(User adminUser) {
        verifyAdminRole(adminUser);

        String cacheKey = "admin:stats";
        return cacheService.getOrCompute(cacheKey, Duration.ofMinutes(5), () -> {
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalUsers", userRepository.count());
            stats.put("totalCredentials", credentialRepository.count());
            stats.put("totalSecurityEvents", securityEventRepository.count());
            return stats;
        });
    }
}
