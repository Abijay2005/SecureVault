package com.securevault.backend.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity 
@Table(name = "users")
public class User {
    
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    @Column(nullable = true)
    private String role = "USER"; // USER, TEAM_MEMBER, ADMINISTRATOR

    @Column(name = "mfa_enabled", nullable = true)
    private Boolean mfaEnabled = false;

    @Column(name = "mfa_secret", nullable = true)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String mfaSecret;

    @Column(name = "mfa_backup_codes", length = 1000, nullable = true)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String mfaBackupCodes;
    
    public User() {
    }

    public User(Long id, String name, String email, String password, String role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role != null ? role : "USER";
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public boolean isMfaEnabled() {
        return Boolean.TRUE.equals(mfaEnabled);
    }

    public void setMfaEnabled(Boolean mfaEnabled) {
        this.mfaEnabled = mfaEnabled;
    }

    public String getMfaSecret() {
        return mfaSecret;
    }

    public void setMfaSecret(String mfaSecret) {
        this.mfaSecret = mfaSecret;
    }

    public String getMfaBackupCodes() {
        return mfaBackupCodes;
    }

    public void setMfaBackupCodes(String mfaBackupCodes) {
        this.mfaBackupCodes = mfaBackupCodes;
    }
}
