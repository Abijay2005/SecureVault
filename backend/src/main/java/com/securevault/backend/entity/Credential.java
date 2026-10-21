package com.securevault.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity 
@Table(name = "credentials")
public class Credential {
    
    @ManyToOne 
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String username;
    
    @Column(length = 1024)
    private String password;

    @Column(nullable = true)
    private String category = "General"; // General, Work, Personal, Finance, Social, Development, Cloud

    @Column(name = "credential_type", nullable = true)
    private String credentialType = "LOGIN"; // LOGIN, SECURE_NOTE, API_KEY, CREDIT_CARD, SERVER_CREDENTIAL

    @Column(name = "is_favorite", nullable = true)
    private Boolean isFavorite = false;

    @Column(length = 4096)
    private String notes; // Encrypted AES-256 GCM

    private String url;

    private String tags;

    @Column(name = "created_at", nullable = true)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = true)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Credential() {
    }

    public Credential(Long id, User user, String title, String username, String password) {
        this.id = id;
        this.user = user;
        this.title = title;
        this.username = username;
        this.password = password;
        this.category = "General";
        this.credentialType = "LOGIN";
        this.isFavorite = false;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
        if (category == null) category = "General";
        if (credentialType == null) credentialType = "LOGIN";
        if (isFavorite == null) isFavorite = false;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public User getUser() {
        return user;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getTitle() {
        return title;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getUsername() {
        return username;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getPassword() {
        return password;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category != null ? category : "General";
    }

    public String getCredentialType() {
        return credentialType;
    }

    public void setCredentialType(String credentialType) {
        this.credentialType = credentialType != null ? credentialType : "LOGIN";
    }

    public Boolean getIsFavorite() {
        return Boolean.TRUE.equals(isFavorite);
    }

    public void setIsFavorite(Boolean isFavorite) {
        this.isFavorite = isFavorite != null && isFavorite;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getTags() {
        return tags;
    }

    public void setTags(String tags) {
        this.tags = tags;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
