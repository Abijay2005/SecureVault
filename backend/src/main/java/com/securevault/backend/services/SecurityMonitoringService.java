package com.securevault.backend.services;

import com.securevault.backend.entity.Device;
import com.securevault.backend.entity.SecurityEvent;
import com.securevault.backend.entity.User;
import com.securevault.backend.repository.DeviceRepository;
import com.securevault.backend.repository.NotificationRepository;
import com.securevault.backend.repository.SecurityEventRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class SecurityMonitoringService {

    private final SecurityEventRepository securityEventRepository;
    private final DeviceRepository deviceRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;
    private final CacheService cacheService;

    public SecurityMonitoringService(SecurityEventRepository securityEventRepository,
                                     DeviceRepository deviceRepository,
                                     NotificationRepository notificationRepository,
                                     NotificationService notificationService,
                                     CacheService cacheService) {
        this.securityEventRepository = securityEventRepository;
        this.deviceRepository = deviceRepository;
        this.notificationRepository = notificationRepository;
        this.notificationService = notificationService;
        this.cacheService = cacheService;
    }

    public SecurityEvent recordLoginAttempt(User user, String attemptedEmail, boolean success, String ipAddress, String userAgent, String reason) {
        String riskLevel = "LOW";
        String status = success ? "SUCCESS" : "FAILURE";
        String eventType = success ? "LOGIN_SUCCESS" : "LOGIN_FAILED";

        LocalDateTime fifteenMinutesAgo = LocalDateTime.now().minusMinutes(15);
        long recentFailures = securityEventRepository.countByUserEmailAndEventTypeAndTimestampAfter(
                attemptedEmail, "LOGIN_FAILED", fifteenMinutesAgo
        );

        if (!success) {
            if (recentFailures >= 3) {
                riskLevel = "HIGH";
                eventType = "SUSPICIOUS_LOGIN_BURST";
                if (user != null) {
                    notificationService.sendSecurityAlert(
                            user,
                            "Multiple Failed Logins Detected",
                            "We detected " + (recentFailures + 1) + " consecutive failed login attempts from IP: " + ipAddress
                    );
                }
            } else {
                riskLevel = "MEDIUM";
            }
        } else if (user != null) {
            // Check for new device
            String fingerprint = generateDeviceFingerprint(userAgent);
            Optional<Device> existingDevice = deviceRepository.findByUserAndDeviceFingerprint(user, fingerprint);
            if (existingDevice.isEmpty()) {
                riskLevel = "MEDIUM";
                // Register new device
                Device newDevice = new Device(
                        user,
                        fingerprint,
                        extractBrowser(userAgent),
                        extractOS(userAgent),
                        ipAddress,
                        false
                );
                deviceRepository.save(newDevice);

                notificationService.sendLoginAlert(
                        user,
                        newDevice.getBrowser() + " on " + newDevice.getOs(),
                        ipAddress,
                        false
                );
            } else {
                Device dev = existingDevice.get();
                dev.setLastSeen(LocalDateTime.now());
                dev.setIpAddress(ipAddress);
                deviceRepository.save(dev);
            }
        }

        SecurityEvent event = new SecurityEvent(
                user,
                attemptedEmail,
                eventType,
                status,
                ipAddress,
                userAgent,
                riskLevel,
                reason != null ? reason : (success ? "Successful authentication" : "Authentication failed")
        );
        event.setDeviceFingerprint(generateDeviceFingerprint(userAgent));
        SecurityEvent saved = securityEventRepository.save(event);

        if (user != null) {
            cacheService.invalidateUserCache(user.getId());
        }
        cacheService.invalidateAdminStats();

        return saved;
    }

    public List<SecurityEvent> getUserEvents(User user) {
        return securityEventRepository.findByUserOrderByTimestampDesc(user);
    }

    public Map<String, Object> getAnalytics(User user, String timeframe) {
        String cleanTimeframe = timeframe != null ? timeframe.toLowerCase() : "30d";
        String cacheKey = "analytics:" + user.getId() + ":" + cleanTimeframe;

        return cacheService.getOrCompute(cacheKey, Duration.ofMinutes(5), () -> {
            LocalDateTime cutoff = switch (cleanTimeframe) {
                case "today" -> LocalDateTime.now().minusDays(1);
                case "7d" -> LocalDateTime.now().minusDays(7);
                case "30d" -> LocalDateTime.now().minusDays(30);
                default -> LocalDateTime.now().minusDays(30);
            };

            List<SecurityEvent> events = securityEventRepository.findByUserAndTimestampAfterOrderByTimestampDesc(user, cutoff);

            long successfulLogins = events.stream().filter(e -> "SUCCESS".equals(e.getStatus())).count();
            long failedLogins = events.stream().filter(e -> "FAILURE".equals(e.getStatus())).count();
            long suspiciousEvents = events.stream().filter(e -> "HIGH".equals(e.getRiskLevel()) || "CRITICAL".equals(e.getRiskLevel())).count();
            long unreadAlerts = notificationRepository.countByUserAndReadStatusFalse(user);

            Map<String, Object> result = new HashMap<>();
            result.put("timeframe", cleanTimeframe);
            result.put("successfulLogins", successfulLogins);
            result.put("failedLogins", failedLogins);
            result.put("suspiciousEvents", suspiciousEvents);
            result.put("activeAlerts", unreadAlerts);
            result.put("totalEvents", events.size());
            result.put("recentEvents", events.stream().limit(10).toList());

            return result;
        });
    }

    public String generateDeviceFingerprint(String userAgent) {
        if (userAgent == null) return "unknown-device";
        return Integer.toHexString(userAgent.hashCode());
    }

    private String extractBrowser(String userAgent) {
        if (userAgent == null) return "Unknown Browser";
        if (userAgent.contains("Edg")) return "Microsoft Edge";
        if (userAgent.contains("Chrome")) return "Google Chrome";
        if (userAgent.contains("Firefox")) return "Mozilla Firefox";
        if (userAgent.contains("Safari")) return "Apple Safari";
        return "Generic Browser";
    }

    private String extractOS(String userAgent) {
        if (userAgent == null) return "Unknown OS";
        if (userAgent.contains("Windows")) return "Windows";
        if (userAgent.contains("Macintosh") || userAgent.contains("Mac OS")) return "macOS";
        if (userAgent.contains("Linux")) return "Linux";
        if (userAgent.contains("Android")) return "Android";
        if (userAgent.contains("iPhone") || userAgent.contains("iPad")) return "iOS";
        return "Generic OS";
    }
}
