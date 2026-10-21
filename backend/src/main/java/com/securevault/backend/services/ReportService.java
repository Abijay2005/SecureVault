package com.securevault.backend.services;

import com.securevault.backend.dto.ReportDataset;
import com.securevault.backend.entity.Credential;
import com.securevault.backend.entity.Device;
import com.securevault.backend.entity.SecurityEvent;
import com.securevault.backend.entity.User;
import com.securevault.backend.entity.UserSession;
import com.securevault.backend.repository.CredentialRepository;
import com.securevault.backend.repository.DeviceRepository;
import com.securevault.backend.repository.SecurityEventRepository;
import com.securevault.backend.repository.UserSessionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class ReportService {

    private final CredentialRepository credentialRepository;
    private final SecurityEventRepository securityEventRepository;
    private final DeviceRepository deviceRepository;
    private final UserSessionRepository userSessionRepository;
    private final CredentialService credentialService;
    private final PasswordGeneratorService passwordGeneratorService;

    public ReportService(CredentialRepository credentialRepository,
                         SecurityEventRepository securityEventRepository,
                         DeviceRepository deviceRepository,
                         UserSessionRepository userSessionRepository,
                         CredentialService credentialService,
                         PasswordGeneratorService passwordGeneratorService) {
        this.credentialRepository = credentialRepository;
        this.securityEventRepository = securityEventRepository;
        this.deviceRepository = deviceRepository;
        this.userSessionRepository = userSessionRepository;
        this.credentialService = credentialService;
        this.passwordGeneratorService = passwordGeneratorService;
    }

    public ReportDataset generateReport(User user, String reportType) {
        if (reportType == null) reportType = "SECURITY_REPORT";

        return switch (reportType.toUpperCase()) {
            case "PASSWORD_HEALTH" -> generatePasswordHealthReport(user);
            case "AUDIT_REPORT" -> generateAuditReport(user);
            case "USER_ACTIVITY" -> generateUserActivityReport(user);
            case "THREAT_MONITORING" -> generateThreatMonitoringReport(user);
            default -> generateSecurityReport(user);
        };
    }

    private ReportDataset generateSecurityReport(User user) {
        List<SecurityEvent> events = securityEventRepository.findByUserOrderByTimestampDesc(user);
        List<Device> devices = deviceRepository.findByUserOrderByLastSeenDesc(user);

        long successfulLogins = events.stream().filter(e -> "SUCCESS".equals(e.getStatus())).count();
        long failedLogins = events.stream().filter(e -> "FAILURE".equals(e.getStatus())).count();
        long highRiskEvents = events.stream().filter(e -> "HIGH".equals(e.getRiskLevel()) || "CRITICAL".equals(e.getRiskLevel())).count();
        long trustedDevices = devices.stream().filter(Device::isTrusted).count();

        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("Total Security Events", events.size());
        metrics.put("Successful Sign-Ins", successfulLogins);
        metrics.put("Failed Attempts", failedLogins);
        metrics.put("High Risk Anomalies", highRiskEvents);
        metrics.put("Recognized Devices", devices.size());
        metrics.put("Trusted Devices", trustedDevices);

        List<String> headers = Arrays.asList("Timestamp", "Event Type", "Status", "Risk Level", "IP Address", "Details");
        List<List<String>> rows = new ArrayList<>();

        for (SecurityEvent ev : events) {
            rows.add(Arrays.asList(
                    ev.getTimestamp().toString(),
                    ev.getEventType(),
                    ev.getStatus(),
                    ev.getRiskLevel(),
                    ev.getIpAddress(),
                    ev.getDetails()
            ));
        }

        return new ReportDataset("SECURITY_REPORT", "Executive Security & Telemetry Report", user.getEmail(), metrics, headers, rows);
    }

    private ReportDataset generatePasswordHealthReport(User user) {
        List<Credential> credentials = credentialRepository.findByUserOrderByUpdatedAtDesc(user);
        credentials.forEach(credentialService::decryptCredential);

        int total = credentials.size();
        int weakCount = 0;
        int reusedCount = 0;
        int oldPasswordCount = 0;

        Map<String, Integer> passwordFrequency = new HashMap<>();
        for (Credential c : credentials) {
            if (c.getPassword() != null && !c.getPassword().isEmpty()) {
                passwordFrequency.put(c.getPassword(), passwordFrequency.getOrDefault(c.getPassword(), 0) + 1);
            }
        }

        List<List<String>> rows = new ArrayList<>();
        List<String> headers = Arrays.asList("Service Title", "Username", "Category", "Strength Score", "Age (Days)", "Reused Status", "Recommendation");

        for (Credential c : credentials) {
            String pwd = c.getPassword() != null ? c.getPassword() : "";
            var strength = passwordGeneratorService.evaluateStrength(pwd);

            boolean isWeak = "WEAK".equalsIgnoreCase(strength.getScore());
            if (isWeak) weakCount++;

            boolean isReused = passwordFrequency.getOrDefault(pwd, 0) > 1;
            if (isReused) reusedCount++;

            long ageDays = c.getUpdatedAt() != null ? ChronoUnit.DAYS.between(c.getUpdatedAt(), LocalDateTime.now()) : 0;
            if (ageDays > 90) oldPasswordCount++;

            String recommendation = isWeak ? "Rotate to stronger password" : (isReused ? "Avoid password reuse" : (ageDays > 90 ? "Consider periodic rotation" : "Optimal"));

            rows.add(Arrays.asList(
                    c.getTitle(),
                    c.getUsername(),
                    c.getCategory(),
                    strength.getScore() + " (" + strength.getScorePercentage() + "%)",
                    String.valueOf(ageDays),
                    isReused ? "REUSED" : "UNIQUE",
                    recommendation
            ));
        }

        int score = total == 0 ? 100 : Math.max(0, 100 - (weakCount * 20 + reusedCount * 15 + oldPasswordCount * 5));

        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("Overall Vault Health Score", score + " / 100");
        metrics.put("Total Evaluated Items", total);
        metrics.put("Weak Passwords", weakCount);
        metrics.put("Reused Passwords", reusedCount);
        metrics.put("Stale Passwords (>90 Days)", oldPasswordCount);

        return new ReportDataset("PASSWORD_HEALTH", "Vault Password Health & Hygiene Audit", user.getEmail(), metrics, headers, rows);
    }

    private ReportDataset generateAuditReport(User user) {
        List<SecurityEvent> events = securityEventRepository.findByUserOrderByTimestampDesc(user);

        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("Total Audit Records", events.size());
        metrics.put("Audit Period", "All Time");
        metrics.put("Target Account", user.getEmail());

        List<String> headers = Arrays.asList("Record ID", "Timestamp", "Action / Event", "Result", "Risk", "Source IP", "Device / Agent Details");
        List<List<String>> rows = new ArrayList<>();

        for (SecurityEvent ev : events) {
            rows.add(Arrays.asList(
                    "#" + ev.getId(),
                    ev.getTimestamp().toString(),
                    ev.getEventType(),
                    ev.getStatus(),
                    ev.getRiskLevel(),
                    ev.getIpAddress(),
                    ev.getUserAgent() != null ? ev.getUserAgent() : "N/A"
            ));
        }

        return new ReportDataset("AUDIT_REPORT", "System Compliance & Audit Trail", user.getEmail(), metrics, headers, rows);
    }

    private ReportDataset generateUserActivityReport(User user) {
        List<UserSession> sessions = userSessionRepository.findByUser(user);
        List<Device> devices = deviceRepository.findByUserOrderByLastSeenDesc(user);

        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("Active Sessions", sessions.size());
        metrics.put("Tracked Devices", devices.size());
        metrics.put("Account Creation Date", user.getId() != null ? "Active User #" + user.getId() : "N/A");

        List<String> headers = Arrays.asList("Device Type", "Browser", "Operating System", "IP Address", "Last Seen", "Trust State");
        List<List<String>> rows = new ArrayList<>();

        for (Device dev : devices) {
            rows.add(Arrays.asList(
                    dev.getDeviceFingerprint(),
                    dev.getBrowser(),
                    dev.getOs(),
                    dev.getIpAddress(),
                    dev.getLastSeen().toString(),
                    dev.isTrusted() ? "TRUSTED" : "UNTRUSTED"
            ));
        }

        return new ReportDataset("USER_ACTIVITY", "User Activity & Device Lifecycle Report", user.getEmail(), metrics, headers, rows);
    }

    private ReportDataset generateThreatMonitoringReport(User user) {
        List<SecurityEvent> highRiskEvents = securityEventRepository.findByUserOrderByTimestampDesc(user).stream()
                .filter(e -> "FAILURE".equals(e.getStatus()) || "HIGH".equals(e.getRiskLevel()) || "CRITICAL".equals(e.getRiskLevel()) || "MEDIUM".equals(e.getRiskLevel()))
                .toList();

        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("Total Threat Indicators", highRiskEvents.size());
        metrics.put("Threat Status", highRiskEvents.isEmpty() ? "HEALTHY - No Active Threats" : "ELEVATED VIGILANCE");

        List<String> headers = Arrays.asList("Timestamp", "Threat Category", "Anomaly Type", "Source IP", "Risk Score", "Diagnostic Details");
        List<List<String>> rows = new ArrayList<>();

        for (SecurityEvent ev : highRiskEvents) {
            rows.add(Arrays.asList(
                    ev.getTimestamp().toString(),
                    "AUTHENTICATION_ANOMALY",
                    ev.getEventType(),
                    ev.getIpAddress(),
                    ev.getRiskLevel(),
                    ev.getDetails()
            ));
        }

        return new ReportDataset("THREAT_MONITORING", "Threat Monitoring & Anomaly Detection Report", user.getEmail(), metrics, headers, rows);
    }
}
