package com.securevault.backend.services;

import com.securevault.backend.entity.*;
import com.securevault.backend.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SharingService {

    private final CredentialShareRepository credentialShareRepository;
    private final TeamCredentialShareRepository teamCredentialShareRepository;
    private final CredentialRepository credentialRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final EncryptionService encryptionService;
    private final NotificationService notificationService;

    public SharingService(CredentialShareRepository credentialShareRepository,
                          TeamCredentialShareRepository teamCredentialShareRepository,
                          CredentialRepository credentialRepository,
                          UserRepository userRepository,
                          TeamRepository teamRepository,
                          TeamMemberRepository teamMemberRepository,
                          EncryptionService encryptionService,
                          NotificationService notificationService) {
        this.credentialShareRepository = credentialShareRepository;
        this.teamCredentialShareRepository = teamCredentialShareRepository;
        this.credentialRepository = credentialRepository;
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.encryptionService = encryptionService;
        this.notificationService = notificationService;
    }

    // --- Individual Sharing ---

    public CredentialShare shareCredential(Long credentialId, User owner, String targetEmail, PermissionLevel permission, Integer expirationMinutes) {
        Credential credential = credentialRepository.findById(credentialId)
                .orElseThrow(() -> new RuntimeException("Credential not found"));

        if (!credential.getUser().getId().equals(owner.getId())) {
            throw new RuntimeException("Unauthorized: Only the owner can share this credential");
        }

        User targetUser = userRepository.findByEmail(targetEmail)
                .orElseThrow(() -> new RuntimeException("Target user not found with email: " + targetEmail));

        if (targetUser.getId().equals(owner.getId())) {
            throw new RuntimeException("You cannot share a credential with yourself");
        }

        LocalDateTime expiresAt = null;
        if (expirationMinutes != null && expirationMinutes > 0) {
            expiresAt = LocalDateTime.now().plusMinutes(expirationMinutes);
        }

        CredentialShare share = credentialShareRepository.findByCredentialAndSharedWithUser(credential, targetUser)
                .orElse(new CredentialShare(credential, owner, targetUser, permission, expiresAt));

        share.setPermission(permission);
        share.setExpiresAt(expiresAt);

        CredentialShare saved = credentialShareRepository.save(share);

        // Notify recipient
        notificationService.sendSharingNotification(targetUser, owner.getEmail(), credential.getTitle(), permission.name());

        return saved;
    }

    public List<CredentialShare> getSharedWithMe(User user) {
        List<CredentialShare> shares = credentialShareRepository.findBySharedWithUser(user);
        return shares.stream()
                .filter(share -> !share.isExpired())
                .peek(share -> decryptCredential(share.getCredential()))
                .collect(Collectors.toList());
    }

    public List<CredentialShare> getSharedByMe(User user) {
        return credentialShareRepository.findByOwner(user);
    }

    public void revokeShare(Long shareId, User user) {
        CredentialShare share = credentialShareRepository.findById(shareId)
                .orElseThrow(() -> new RuntimeException("Share record not found"));

        if (!share.getOwner().getId().equals(user.getId()) && share.getPermission() != PermissionLevel.FULL_MANAGEMENT) {
            throw new RuntimeException("Unauthorized: You do not have permission to revoke this share");
        }

        User recipient = share.getSharedWithUser();
        String title = share.getCredential() != null ? share.getCredential().getTitle() : "Credential";
        String ownerEmail = share.getOwner() != null ? share.getOwner().getEmail() : "Owner";

        credentialShareRepository.delete(share);

        if (recipient != null) {
            notificationService.sendShareRevokedNotification(recipient, ownerEmail, title);
        }
    }

    // --- Team Sharing ---

    public TeamCredentialShare shareCredentialWithTeam(Long credentialId, User owner, Long teamId, PermissionLevel permission, Integer expirationMinutes) {
        Credential credential = credentialRepository.findById(credentialId)
                .orElseThrow(() -> new RuntimeException("Credential not found"));

        if (!credential.getUser().getId().equals(owner.getId())) {
            throw new RuntimeException("Unauthorized: Only the owner can share this credential");
        }

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        // Verify requester is a member or owner of the team
        boolean isTeamMemberOrOwner = team.getOwner().getId().equals(owner.getId()) ||
                teamMemberRepository.findByTeamAndUser(team, owner).isPresent();

        if (!isTeamMemberOrOwner) {
            throw new RuntimeException("Unauthorized: You are not a member of this team");
        }

        LocalDateTime expiresAt = null;
        if (expirationMinutes != null && expirationMinutes > 0) {
            expiresAt = LocalDateTime.now().plusMinutes(expirationMinutes);
        }

        TeamCredentialShare share = teamCredentialShareRepository.findByCredentialAndTeam(credential, team)
                .orElse(new TeamCredentialShare(credential, owner, team, permission, expiresAt));

        share.setPermission(permission);
        share.setExpiresAt(expiresAt);

        TeamCredentialShare saved = teamCredentialShareRepository.save(share);

        // Notify all team members
        List<TeamMember> members = teamMemberRepository.findByTeam(team);
        for (TeamMember m : members) {
            if (!m.getUser().getId().equals(owner.getId())) {
                notificationService.sendTeamSharingNotification(m.getUser(), owner.getEmail(), team.getName(), credential.getTitle(), permission.name());
            }
        }

        return saved;
    }

    public List<TeamCredentialShare> getTeamSharesForUser(User user) {
        // Collect all teams where user is member or owner
        Set<Team> userTeams = new HashSet<>();
        List<TeamMember> memberships = teamMemberRepository.findByUser(user);
        for (TeamMember tm : memberships) {
            userTeams.add(tm.getTeam());
        }
        userTeams.addAll(teamRepository.findByOwner(user));

        if (userTeams.isEmpty()) {
            return Collections.emptyList();
        }

        List<TeamCredentialShare> shares = teamCredentialShareRepository.findByTeamIn(new ArrayList<>(userTeams));
        return shares.stream()
                .filter(share -> !share.isExpired())
                .peek(share -> decryptCredential(share.getCredential()))
                .collect(Collectors.toList());
    }

    public List<TeamCredentialShare> getTeamSharesByTeam(Long teamId, User user) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        boolean isMember = team.getOwner().getId().equals(user.getId()) ||
                teamMemberRepository.findByTeamAndUser(team, user).isPresent();

        if (!isMember) {
            throw new RuntimeException("Unauthorized: You are not a member of this team");
        }

        List<TeamCredentialShare> shares = teamCredentialShareRepository.findByTeam(team);
        return shares.stream()
                .filter(share -> !share.isExpired())
                .peek(share -> decryptCredential(share.getCredential()))
                .collect(Collectors.toList());
    }

    public List<TeamCredentialShare> getTeamSharesByOwner(User user) {
        return teamCredentialShareRepository.findByOwner(user);
    }

    public void revokeTeamShare(Long teamShareId, User user) {
        TeamCredentialShare share = teamCredentialShareRepository.findById(teamShareId)
                .orElseThrow(() -> new RuntimeException("Team share record not found"));

        boolean isOwner = share.getOwner().getId().equals(user.getId());
        boolean isTeamAdmin = share.getTeam().getOwner().getId().equals(user.getId()) ||
                teamMemberRepository.findByTeamAndUser(share.getTeam(), user)
                        .map(m -> "ADMIN".equalsIgnoreCase(m.getRole()))
                        .orElse(false);

        if (!isOwner && !isTeamAdmin && share.getPermission() != PermissionLevel.FULL_MANAGEMENT) {
            throw new RuntimeException("Unauthorized: You do not have permission to revoke this team share");
        }

        String title = share.getCredential() != null ? share.getCredential().getTitle() : "Credential";
        String ownerEmail = share.getOwner() != null ? share.getOwner().getEmail() : "Owner";
        Team team = share.getTeam();

        teamCredentialShareRepository.delete(share);

        // Notify team members
        if (team != null) {
            List<TeamMember> members = teamMemberRepository.findByTeam(team);
            for (TeamMember m : members) {
                if (!m.getUser().getId().equals(user.getId())) {
                    notificationService.sendTeamShareRevokedNotification(m.getUser(), ownerEmail, team.getName(), title);
                }
            }
        }
    }

    // --- Credential Update Support (Individual or Team) ---

    public Credential updateSharedCredential(Long credentialId, User user, Credential updatedData) {
        Credential credential = credentialRepository.findById(credentialId)
                .orElseThrow(() -> new RuntimeException("Credential not found"));

        // Check if shared via individual share
        Optional<CredentialShare> individualShare = credentialShareRepository.findByCredentialAndSharedWithUser(credential, user);
        
        PermissionLevel effectivePermission = null;

        if (individualShare.isPresent() && !individualShare.get().isExpired()) {
            effectivePermission = individualShare.get().getPermission();
        } else {
            // Check if shared via any team user is member of
            List<TeamMember> memberships = teamMemberRepository.findByUser(user);
            List<Team> teams = memberships.stream().map(TeamMember::getTeam).collect(Collectors.toList());
            teams.addAll(teamRepository.findByOwner(user));

            if (!teams.isEmpty()) {
                List<TeamCredentialShare> teamShares = teamCredentialShareRepository.findByTeamIn(teams);
                for (TeamCredentialShare ts : teamShares) {
                    if (ts.getCredential().getId().equals(credentialId) && !ts.isExpired()) {
                        if (effectivePermission == null || ts.getPermission().ordinal() > effectivePermission.ordinal()) {
                            effectivePermission = ts.getPermission();
                        }
                    }
                }
            }
        }

        if (effectivePermission == null) {
            throw new RuntimeException("Unauthorized: This credential is not shared with you or access has expired");
        }

        if (effectivePermission == PermissionLevel.VIEW_ONLY) {
            throw new RuntimeException("Unauthorized: You only have VIEW_ONLY permission for this credential");
        }

        credential.setTitle(updatedData.getTitle());
        credential.setUsername(updatedData.getUsername());
        if (updatedData.getPassword() != null && !updatedData.getPassword().isEmpty()) {
            credential.setPassword(encryptionService.encrypt(updatedData.getPassword()));
        }
        if (updatedData.getNotes() != null) {
            credential.setNotes(encryptionService.encrypt(updatedData.getNotes()));
        }

        Credential saved = credentialRepository.save(credential);
        saved.setPassword(encryptionService.decrypt(saved.getPassword()));
        return saved;
    }

    private void decryptCredential(Credential cred) {
        if (cred != null) {
            if (cred.getPassword() != null) {
                cred.setPassword(encryptionService.decrypt(cred.getPassword()));
            }
            if (cred.getNotes() != null) {
                cred.setNotes(encryptionService.decrypt(cred.getNotes()));
            }
        }
    }
}
