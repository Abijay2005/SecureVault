package com.securevault.backend.repository;

import com.securevault.backend.entity.User;
import com.securevault.backend.entity.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserSessionRepository extends JpaRepository<UserSession, Long> {
    List<UserSession> findByUser(User user);
    List<UserSession> findByUserAndActiveTrue(User user);
    Optional<UserSession> findByTokenHashAndActiveTrue(String tokenHash);
}
