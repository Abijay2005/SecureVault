package com.securevault.backend.controllers;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.securevault.backend.entity.Credential;
import com.securevault.backend.entity.User;
import com.securevault.backend.repository.UserRepository;
import com.securevault.backend.services.CredentialService;
import com.securevault.backend.services.JwtService;

@RestController 
@RequestMapping("/api/credentials")
public class CredentialController {

    private final CredentialService credentialService;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    public CredentialController(CredentialService credentialService, JwtService jwtService, UserRepository userRepository) {
        this.credentialService = credentialService;
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

    @PostMapping
    public ResponseEntity<?> addCredential(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody Credential credential) {
        try {
            User user = getAuthenticatedUser(authorization);
            Credential created = credentialService.createCredential(credential, user);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getCredentials(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        try {
            User user = getAuthenticatedUser(authorization);
            List<Credential> credentials = credentialService.getUserCredentials(user);
            return ResponseEntity.ok(credentials);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCredential(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        try {
            User user = getAuthenticatedUser(authorization);
            Credential credential = credentialService.getCredentialById(id, user);
            return ResponseEntity.ok(credential);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCredential(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody Credential credential) {
        try {
            User user = getAuthenticatedUser(authorization);
            Credential updated = credentialService.updateCredential(id, user, credential);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/favorite")
    public ResponseEntity<?> toggleFavorite(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        try {
            User user = getAuthenticatedUser(authorization);
            Credential updated = credentialService.toggleFavorite(id, user);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchCredentials(
            @RequestParam(required = false, defaultValue = "") String query,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        try {
            User user = getAuthenticatedUser(authorization);
            List<Credential> list = credentialService.searchCredentials(user, query);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/filter")
    public ResponseEntity<?> filterCredentials(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Boolean favorite,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        try {
            User user = getAuthenticatedUser(authorization);
            List<Credential> list = credentialService.filterCredentials(user, category, type, favorite);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/categories")
    public ResponseEntity<?> getCategories() {
        return ResponseEntity.ok(CredentialService.CATEGORIES);
    }

    @GetMapping("/types")
    public ResponseEntity<?> getCredentialTypes() {
        return ResponseEntity.ok(CredentialService.CREDENTIAL_TYPES);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCredential(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        try {
            User user = getAuthenticatedUser(authorization);
            credentialService.deleteCredential(id, user);
            return ResponseEntity.ok(Map.of("message", "Deleted Successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }
}
