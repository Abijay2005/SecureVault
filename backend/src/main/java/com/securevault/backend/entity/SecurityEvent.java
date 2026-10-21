package com.securevault.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "security_events")
public class SecurityEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private String userEmail;

    @Column(nullable = false)
    private String eventType; // LOGIN_SUCCESS, LOGIN_FAILED, SUSPICIOUS_LOGIN, etc.

    @Column(nullable = false)
    private String status; // SUCCESS, FAILURE, SUSPICIOUS

    private String ipAddress;
    private String userAgent;
    private String deviceFingerprint;

    @Column(nullable = false)
    private String riskLevel = "LOW"; // LOW, MEDIUM, HIGH, CRITICAL

    private String details;

    private LocalDateTime timestamp = LocalDateTime.now();

    public SecurityEvent() {
    }

    public SecurityEvent(User user, String userEmail, String eventType, String status, String ipAddress, String userAgent, String riskLevel, String details) {
        this.user = user;
        this.userEmail = userEmail;
        this.eventType = eventType;
        this.status = status;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.riskLevel = riskLevel;
        this.details = details;
        this.timestamp = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }

    public String getDeviceFingerprint() { return deviceFingerprint; }
    public void setDeviceFingerprint(String deviceFingerprint) { this.deviceFingerprint = deviceFingerprint; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
