package com.securevault.backend.controllers;

import com.securevault.backend.entity.Credential;
import com.securevault.backend.entity.CredentialShare;
import com.securevault.backend.entity.PermissionLevel;
import com.securevault.backend.entity.TeamCredentialShare;
import com.securevault.backend.entity.User;
import com.securevault.backend.repository.UserRepository;
import com.securevault.backend.services.JwtService;
import com.securevault.backend.services.SharingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sharing")
public class SharingController {

    private final SharingService sharingService;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    public SharingController(SharingService sharingService, JwtService jwtService, UserRepository userRepository) {
        this.sharingService = sharingService;
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

    public static class ShareRequest {
        public Long credentialId;
        public String targetEmail;
        public String permission = "VIEW_ONLY"; // VIEW_ONLY, EDIT_ACCESS, FULL_MANAGEMENT
        public Integer expirationMinutes;
    }

    public static class TeamShareRequest {
        public Long credentialId;
        public Long teamId;
        public String permission = "VIEW_ONLY"; // VIEW_ONLY, EDIT_ACCESS, FULL_MANAGEMENT
        public Integer expirationMinutes;
    }

    // --- Individual Sharing Endpoints ---

    @PostMapping("/share")
    public ResponseEntity<?> shareCredential(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody ShareRequest request) {
        try {
            User user = getAuthenticatedUser(authorization);
            PermissionLevel perm = PermissionLevel.valueOf(request.permission.toUpperCase());
            CredentialShare share = sharingService.shareCredential(
                    request.credentialId,
                    user,
                    request.targetEmail,
                    perm,
                    request.expirationMinutes
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(share);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/shared-with-me")
    public ResponseEntity<?> getSharedWithMe(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        try {
            User user = getAuthenticatedUser(authorization);
            List<CredentialShare> shares = sharingService.getSharedWithMe(user);
            return ResponseEntity.ok(shares);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/shared-by-me")
    public ResponseEntity<?> getSharedByMe(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        try {
            User user = getAuthenticatedUser(authorization);
            List<CredentialShare> shares = sharingService.getSharedByMe(user);
            return ResponseEntity.ok(shares);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/revoke/{id}")
    public ResponseEntity<?> revokeShare(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        try {
            User user = getAuthenticatedUser(authorization);
            sharingService.revokeShare(id, user);
            return ResponseEntity.ok(Map.of("message", "Share revoked successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    // --- Team Sharing Endpoints ---

    @PostMapping("/team")
    public ResponseEntity<?> shareCredentialWithTeam(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody TeamShareRequest request) {
        try {
            User user = getAuthenticatedUser(authorization);
            PermissionLevel perm = PermissionLevel.valueOf(request.permission.toUpperCase());
            TeamCredentialShare share = sharingService.shareCredentialWithTeam(
                    request.credentialId,
                    user,
                    request.teamId,
                    perm,
                    request.expirationMinutes
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(share);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/shared-with-teams")
    public ResponseEntity<?> getSharedWithTeams(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        try {
            User user = getAuthenticatedUser(authorization);
            List<TeamCredentialShare> teamShares = sharingService.getTeamSharesForUser(user);
            return ResponseEntity.ok(teamShares);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/teams/{teamId}/credentials")
    public ResponseEntity<?> getTeamCredentials(
            @PathVariable Long teamId,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        try {
            User user = getAuthenticatedUser(authorization);
            List<TeamCredentialShare> shares = sharingService.getTeamSharesByTeam(teamId, user);
            return ResponseEntity.ok(shares);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/team-shares-by-me")
    public ResponseEntity<?> getTeamSharesByMe(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        try {
            User user = getAuthenticatedUser(authorization);
            List<TeamCredentialShare> shares = sharingService.getTeamSharesByOwner(user);
            return ResponseEntity.ok(shares);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/team-share/{id}")
    public ResponseEntity<?> revokeTeamShare(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        try {
            User user = getAuthenticatedUser(authorization);
            sharingService.revokeTeamShare(id, user);
            return ResponseEntity.ok(Map.of("message", "Team share revoked successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    // --- Credential Update ---

    @PutMapping("/credential/{id}")
    public ResponseEntity<?> updateSharedCredential(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody Credential credential) {
        try {
            User user = getAuthenticatedUser(authorization);
            Credential updated = sharingService.updateSharedCredential(id, user, credential);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        }
    }
}
