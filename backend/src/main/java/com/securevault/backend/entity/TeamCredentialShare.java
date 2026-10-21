package com.securevault.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "team_credential_shares")
public class TeamCredentialShare {

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
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PermissionLevel permission = PermissionLevel.VIEW_ONLY;

    private LocalDateTime expiresAt;

    private LocalDateTime createdAt = LocalDateTime.now();

    public TeamCredentialShare() {
    }

    public TeamCredentialShare(Credential credential, User owner, Team team, PermissionLevel permission, LocalDateTime expiresAt) {
        this.credential = credential;
        this.owner = owner;
        this.team = team;
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

    public Team getTeam() { return team; }
    public void setTeam(Team team) { this.team = team; }

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
