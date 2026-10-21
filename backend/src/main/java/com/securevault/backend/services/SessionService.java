package com.securevault.backend.services;

import com.securevault.backend.entity.User;
import com.securevault.backend.entity.UserSession;
import com.securevault.backend.repository.UserSessionRepository;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;

@Service
public class SessionService {

    private final UserSessionRepository userSessionRepository;

    public SessionService(UserSessionRepository userSessionRepository) {
        this.userSessionRepository = userSessionRepository;
    }

    public UserSession createSession(User user, String jwtToken, String ipAddress, String userAgent) {
        String tokenHash = hashToken(jwtToken);
        UserSession session = new UserSession(
                user,
                tokenHash,
                ipAddress,
                userAgent,
                LocalDateTime.now().plusHours(24)
        );
        return userSessionRepository.save(session);
    }

    public List<UserSession> getUserSessions(User user) {
        return userSessionRepository.findByUserAndActiveTrue(user);
    }

    public void revokeSession(Long sessionId, User user) {
        UserSession session = userSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (!session.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized: You cannot revoke another user's session");
        }

        session.setActive(false);
        userSessionRepository.save(session);
    }

    public void revokeSessionByToken(String jwtToken) {
        String tokenHash = hashToken(jwtToken);
        userSessionRepository.findByTokenHashAndActiveTrue(tokenHash)
                .ifPresent(session -> {
                    session.setActive(false);
                    userSessionRepository.save(session);
                });
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            return String.valueOf(token.hashCode());
        }
    }
}
