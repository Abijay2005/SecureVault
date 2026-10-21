package com.securevault.backend.controllers;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.securevault.backend.entity.User;
import com.securevault.backend.entity.UserSession;
import com.securevault.backend.repository.UserRepository;
import com.securevault.backend.services.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final SecurityMonitoringService securityMonitoringService;
    private final UserRepository userRepository;
    private final MfaService mfaService;
    private final PasswordRecoveryService passwordRecoveryService;
    private final SessionService sessionService;
    private final JwtService jwtService;

    public AuthController(UserService userService,
                          SecurityMonitoringService securityMonitoringService,
                          UserRepository userRepository,
                          MfaService mfaService,
                          PasswordRecoveryService passwordRecoveryService,
                          SessionService sessionService,
                          JwtService jwtService) {
        this.userService = userService;
        this.securityMonitoringService = securityMonitoringService;
        this.userRepository = userRepository;
        this.mfaService = mfaService;
        this.passwordRecoveryService = passwordRecoveryService;
        this.sessionService = sessionService;
        this.jwtService = jwtService;
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

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        try {
            User registeredUser = userService.registerUser(user);
            return ResponseEntity.status(HttpStatus.CREATED).body(registeredUser);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestParam String email,
                                  @RequestParam String password,
                                  HttpServletRequest request) {
        String ip = extractClientIp(request);
        String userAgent = request.getHeader("User-Agent");
        User user = userRepository.findByEmail(email).orElse(null);

        try {
            String token = userService.loginUser(email, password);

            // Check if user has MFA enabled
            if (user != null && user.isMfaEnabled()) {
                String challengeToken = mfaService.createMfaChallenge(email);
                securityMonitoringService.recordLoginAttempt(user, email, true, ip, userAgent, "Password verified, MFA challenge issued");

                Map<String, Object> mfaResponse = new HashMap<>();
                mfaResponse.put("mfaRequired", true);
                mfaResponse.put("challengeToken", challengeToken);
                if (mfaService.isDevMode()) {
                    String code = mfaService.getPendingChallengeCode(challengeToken);
                    mfaResponse.put("hint", "Verification code (dev mode): " + code);
                } else {
                    mfaResponse.put("hint", "Enter the 6-digit code from your authenticator app or the verification code sent to your email.");
                }
                return ResponseEntity.ok(mfaResponse);
            }

            // Normal login completion
            securityMonitoringService.recordLoginAttempt(user, email, true, ip, userAgent, "Successful password authentication");
            if (user != null) {
                sessionService.createSession(user, token, ip, userAgent);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("role", user != null ? user.getRole() : "USER");
            response.put("email", email);
            response.put("name", user != null ? user.getName() : "");
            response.put("mfaEnabled", user != null && user.isMfaEnabled());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            securityMonitoringService.recordLoginAttempt(user, email, false, ip, userAgent, e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/mfa/verify")
    public ResponseEntity<?> verifyMfaChallenge(@RequestBody Map<String, String> payload, HttpServletRequest request) {
        String challengeToken = payload.get("challengeToken");
        String code = payload.get("code");

        boolean isValid = mfaService.verifyMfaChallenge(challengeToken, code);
        if (!isValid) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid or expired verification code"));
        }

        String email = mfaService.getEmailForChallenge(challengeToken);
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtService.generateToken(email);
        sessionService.createSession(user, token, extractClientIp(request), request.getHeader("User-Agent"));

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("role", user.getRole());
        response.put("email", user.getEmail());
        response.put("name", user.getName());
        response.put("mfaEnabled", user.isMfaEnabled());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/mfa/status")
    public ResponseEntity<?> getMfaStatus(@RequestHeader("Authorization") String authorization) {
        try {
            User user = getAuthenticatedUser(authorization);
            return ResponseEntity.ok(Map.of(
                    "mfaEnabled", user.isMfaEnabled(),
                    "email", user.getEmail(),
                    "hasBackupCodes", user.getMfaBackupCodes() != null && !user.getMfaBackupCodes().isEmpty()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/mfa/setup")
    public ResponseEntity<?> setupMfa(@RequestHeader("Authorization") String authorization) {
        try {
            User user = getAuthenticatedUser(authorization);
            MfaService.SetupData setupData = mfaService.initiateMfaSetup(user);
            Map<String, Object> response = new HashMap<>();
            response.put("secretKey", setupData.getSecretKey());
            response.put("formattedKey", setupData.getFormattedKey());
            response.put("qrCode", setupData.getQrCodeDataUrl());
            response.put("otpauthUri", setupData.getOtpauthUri());
            response.put("backupCodes", setupData.getBackupCodes());
            response.put("mfaEnabled", user.isMfaEnabled());
            response.put("instructions", "Scan this QR code with Google Authenticator, Microsoft Authenticator, or 1Password. Then enter the 6-digit code shown on your device to confirm.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/mfa/enable")
    public ResponseEntity<?> enableMfa(@RequestHeader("Authorization") String authorization,
                                       @RequestBody Map<String, String> payload) {
        try {
            User user = getAuthenticatedUser(authorization);
            String code = payload.get("code");
            List<String> backupCodes = mfaService.enableMfa(user, code);
            return ResponseEntity.ok(Map.of(
                    "message", "Two-Factor Authentication successfully enabled on your account.",
                    "mfaEnabled", true,
                    "backupCodes", backupCodes
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/mfa/disable")
    public ResponseEntity<?> disableMfa(@RequestHeader("Authorization") String authorization) {
        try {
            User user = getAuthenticatedUser(authorization);
            mfaService.disableMfa(user);
            return ResponseEntity.ok(Map.of("message", "MFA has been disabled", "mfaEnabled", false));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/mfa/backup-codes/regenerate")
    public ResponseEntity<?> regenerateBackupCodes(@RequestHeader("Authorization") String authorization) {
        try {
            User user = getAuthenticatedUser(authorization);
            List<String> codes = mfaService.regenerateBackupCodes(user);
            return ResponseEntity.ok(Map.of(
                    "message", "New backup codes generated",
                    "backupCodes", codes
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestParam String email) {
        try {
            String resetToken = passwordRecoveryService.requestPasswordReset(email);
            return ResponseEntity.ok(Map.of(
                    "message", "Password recovery token generated",
                    "resetToken", resetToken
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> payload) {
        String token = payload.get("token");
        String newPassword = payload.get("newPassword");
        try {
            passwordRecoveryService.resetPassword(token, newPassword);
            return ResponseEntity.ok(Map.of("message", "Password reset successfully. You can now login with your new password."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/oauth/login")
    public ResponseEntity<?> oauthLogin(@RequestBody Map<String, String> payload, HttpServletRequest request) {
        String provider = payload.getOrDefault("provider", "GOOGLE");
        String email = payload.get("email");
        String name = payload.getOrDefault("name", "OAuth User");

        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "OAuth email is required"));
        }

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setName(name);
            newUser.setPassword(new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode("OAuth-Auto-Generated-" + System.currentTimeMillis()));
            newUser.setRole("USER");
            return userRepository.save(newUser);
        });

        String token = jwtService.generateToken(email);
        sessionService.createSession(user, token, extractClientIp(request), request.getHeader("User-Agent"));

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("role", user.getRole());
        response.put("email", user.getEmail());
        response.put("name", user.getName());
        response.put("provider", provider);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/sessions")
    public ResponseEntity<?> getActiveSessions(@RequestHeader("Authorization") String authorization) {
        try {
            User user = getAuthenticatedUser(authorization);
            List<UserSession> sessions = sessionService.getUserSessions(user);
            return ResponseEntity.ok(sessions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/sessions/{id}")
    public ResponseEntity<?> revokeSession(@PathVariable Long id, @RequestHeader("Authorization") String authorization) {
        try {
            User user = getAuthenticatedUser(authorization);
            sessionService.revokeSession(id, user);
            return ResponseEntity.ok(Map.of("message", "Session revoked successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String authorization) {
        if (authorization != null && authorization.startsWith("Bearer ")) {
            sessionService.revokeSessionByToken(authorization.substring(7));
        }
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    private String extractClientIp(HttpServletRequest request) {
        String xForwarded = request.getHeader("X-Forwarded-For");
        if (xForwarded != null && !xForwarded.isEmpty() && !"unknown".equalsIgnoreCase(xForwarded)) {
            return xForwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "127.0.0.1";
    }
}