package com.securevault.backend.repository;

import com.securevault.backend.entity.SecurityEvent;
import com.securevault.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface SecurityEventRepository extends JpaRepository<SecurityEvent, Long> {
    List<SecurityEvent> findByUserOrderByTimestampDesc(User user);
    List<SecurityEvent> findByUserAndTimestampAfterOrderByTimestampDesc(User user, LocalDateTime timestamp);
    long countByUserAndEventTypeAndTimestampAfter(User user, String eventType, LocalDateTime timestamp);
    long countByUserEmailAndEventTypeAndTimestampAfter(String userEmail, String eventType, LocalDateTime timestamp);
}
