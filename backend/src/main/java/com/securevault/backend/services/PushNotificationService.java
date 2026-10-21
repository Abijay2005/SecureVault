package com.securevault.backend.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class PushNotificationService {

    private static final Logger log = LoggerFactory.getLogger(PushNotificationService.class);

    public boolean sendPushNotification(String userEmail, String title, String body, Map<String, String> data) {
        if (userEmail == null || userEmail.trim().isEmpty()) {
            return false;
        }

        // Simulates FCM (Firebase Cloud Messaging) payload delivery to registered user devices
        log.info("[PUSH NOTIFICATION DISPATCH] Target User: {} | Title: '{}' | Body: '{}'", userEmail, title, body);
        return true;
    }
}
