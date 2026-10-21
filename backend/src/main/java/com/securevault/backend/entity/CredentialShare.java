package com.securevault.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "credential_shares")
public class CredentialShare {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "credential_id", nullable = false)
    private Credential credential;

    @ManyToOne(optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(optional = false)
    @JoinColumn(name = "shared_with_user_id", nullable = false)
    private User sharedWithUser;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PermissionLevel permission = PermissionLevel.VIEW_ONLY;

    private LocalDateTime expiresAt;

    private LocalDateTime createdAt = LocalDateTime.now();

    public CredentialShare() {
    }

    public CredentialShare(Credential credential, User owner, User sharedWithUser, PermissionLevel permission, LocalDateTime expiresAt) {
        this.credential = credential;
        this.owner = owner;
        this.sharedWithUser = sharedWithUser;
        this.permission = permission;
        this.expiresAt = expiresAt;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Credential getCredential() { return credential; }
    public void setCredential(Credential credential) { this.credential = credential; }

    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }

    public User getSharedWithUser() { return sharedWithUser; }
    public void setSharedWithUser(User sharedWithUser) { this.sharedWithUser = sharedWithUser; }

    public PermissionLevel getPermission() { return permission; }
    public void setPermission(PermissionLevel permission) { this.permission = permission; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public boolean isExpired() {
        return expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
    }
}
