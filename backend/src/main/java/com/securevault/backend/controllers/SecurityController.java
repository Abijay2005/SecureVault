package com.securevault.backend.controllers;

import com.securevault.backend.entity.Device;
import com.securevault.backend.entity.Notification;
import com.securevault.backend.entity.SecurityEvent;
import com.securevault.backend.entity.User;
import com.securevault.backend.repository.UserRepository;
import com.securevault.backend.services.DeviceService;
import com.securevault.backend.services.JwtService;
import com.securevault.backend.services.NotificationService;
import com.securevault.backend.services.SecurityMonitoringService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/security")
public class SecurityController {

    private final SecurityMonitoringService securityMonitoringService;
    private final DeviceService deviceService;
    private final NotificationService notificationService;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    public SecurityController(SecurityMonitoringService securityMonitoringService,
                              DeviceService deviceService,
                              NotificationService notificationService,
                              JwtService jwtService,
                              UserRepository userRepository) {
        this.securityMonitoringService = securityMonitoringService;
        this.deviceService = deviceService;
        this.notificationService = notificationService;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new RuntimeException("Missing or invalid Authorization header");
        }
        String token = authorization.substring(7);
        String email = jwtService.extractEmail(token);
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @GetMapping("/events")
    public ResponseEntity<?> getEvents(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        try {
            User user = getAuthenticatedUser(authorization);
            List<SecurityEvent> events = securityMonitoringService.getUserEvents(user);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(defaultValue = "30d") String timeframe) {
        try {
            User user = getAuthenticatedUser(authorization);
            Map<String, Object> analytics = securityMonitoringService.getAnalytics(user, timeframe);
            return ResponseEntity.ok(analytics);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/devices")
    public ResponseEntity<?> getDevices(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        try {
            User user = getAuthenticatedUser(authorization);
            List<Device> devices = deviceService.getUserDevices(user);
            return ResponseEntity.ok(devices);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/devices/{id}/trust")
    public ResponseEntity<?> toggleDeviceTrust(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam boolean trusted) {
        try {
            User user = getAuthenticatedUser(authorization);
            Device updated = deviceService.toggleTrust(id, user, trusted);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/devices/{id}")
    public ResponseEntity<?> revokeDevice(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        try {
            User user = getAuthenticatedUser(authorization);
            deviceService.revokeDevice(id, user);
            return ResponseEntity.ok(Map.of("message", "Device revoked successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/notifications")
    public ResponseEntity<?> getNotifications(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        try {
            User user = getAuthenticatedUser(authorization);
            List<Notification> notifications = notificationService.getUserNotifications(user);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/notifications/{id}/read")
    public ResponseEntity<?> markNotificationRead(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        try {
            User user = getAuthenticatedUser(authorization);
            notificationService.markAsRead(id, user);
            return ResponseEntity.ok(Map.of("message", "Notification marked as read"));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/notifications/read-all")
    public ResponseEntity<?> markAllNotificationsRead(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        try {
            User user = getAuthenticatedUser(authorization);
            notificationService.markAllAsRead(user);
            return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }
}
