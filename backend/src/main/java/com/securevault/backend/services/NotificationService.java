package com.securevault.backend.services;

import com.securevault.backend.entity.Notification;
import com.securevault.backend.entity.User;
import com.securevault.backend.repository.NotificationRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    private final PushNotificationService pushNotificationService;

    public NotificationService(NotificationRepository notificationRepository,
                               EmailService emailService,
                               PushNotificationService pushNotificationService) {
        this.notificationRepository = notificationRepository;
        this.emailService = emailService;
        this.pushNotificationService = pushNotificationService;
    }

    public List<Notification> getUserNotifications(User user) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public Notification dispatchNotification(User user, String title, String message, String type, boolean sendEmail, boolean sendPush) {
        if (user == null) return null;

        // 1. In-App Persistent Database Notification
        Notification notification = new Notification(user, title, message, type != null ? type : "SECURITY_ALERT");
        Notification saved = notificationRepository.save(notification);

        // 2. Email Delivery (Never containing plaintext secret credentials)
        if (sendEmail && user.getEmail() != null) {
            String emailBody = String.format("Hello %s,\n\n%s\n\nEvent Type: %s\nTime: %s\n\nSecureVault Security Team",
                    user.getName() != null ? user.getName() : user.getEmail(),
                    message,
                    type,
                    notification.getCreatedAt());
            emailService.sendEmail(user.getEmail(), "[SecureVault Alert] " + title, emailBody);
        }

        // 3. Push Notification (FCM / Mobile / Browser)
        if (sendPush && user.getEmail() != null) {
            pushNotificationService.sendPushNotification(
                    user.getEmail(),
                    title,
                    message,
                    Map.of("type", type, "notificationId", String.valueOf(saved.getId()))
            );
        }

        return saved;
    }

    public void sendLoginAlert(User user, String deviceDescription, String ipAddress, boolean isSuspicious) {
        String title = isSuspicious ? "⚠️ Suspicious Login Detected" : "🔔 New Login From Device";
        String message = String.format("A login was completed on your account from %s (IP: %s).", deviceDescription, ipAddress);
        dispatchNotification(user, title, message, "LOGIN_ALERT", true, true);
    }

    public void sendSecurityAlert(User user, String title, String message) {
        dispatchNotification(user, title, message, "SECURITY_ALERT", true, true);
    }

    public void sendSharingNotification(User recipient, String senderEmail, String credentialTitle, String permission) {
        String title = "🤝 Credential Shared With You";
        String message = String.format("%s has shared '%s' with you with %s permission.", senderEmail, credentialTitle, permission);
        dispatchNotification(recipient, title, message, "SHARING_NOTIFICATION", true, true);
    }

    public void sendTeamSharingNotification(User recipient, String senderEmail, String teamName, String credentialTitle, String permission) {
        String title = "👥 Team Credential Shared (" + teamName + ")";
        String message = String.format("%s shared '%s' with team '%s' with %s permission.", senderEmail, credentialTitle, teamName, permission);
        dispatchNotification(recipient, title, message, "TEAM_SHARING_NOTIFICATION", true, true);
    }

    public void sendShareRevokedNotification(User recipient, String senderEmail, String credentialTitle) {
        String title = "🔒 Shared Access Revoked";
        String message = String.format("Access to '%s' previously shared by %s has been revoked.", credentialTitle, senderEmail);
        dispatchNotification(recipient, title, message, "SHARING_NOTIFICATION", false, true);
    }

    public void sendTeamShareRevokedNotification(User recipient, String senderEmail, String teamName, String credentialTitle) {
        String title = "🔒 Team Share Revoked (" + teamName + ")";
        String message = String.format("Team access to '%s' shared with '%s' by %s has been revoked.", credentialTitle, teamName, senderEmail);
        dispatchNotification(recipient, title, message, "TEAM_SHARING_NOTIFICATION", false, true);
    }

    public void sendPasswordExpirationAlert(User user, String credentialTitle, int daysOld) {
        String title = "⏳ Password Age Warning";
        String message = String.format("Your password for '%s' is %d days old. We recommend rotating it for optimal cybersecurity posture.", credentialTitle, daysOld);
        dispatchNotification(user, title, message, "PASSWORD_EXPIRATION_ALERT", false, false);
    }

    public void markAsRead(Long notificationId, User user) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized: You do not own this notification");
        }

        notification.setReadStatus(true);
        notificationRepository.save(notification);
    }

    public void markAllAsRead(User user) {
        List<Notification> list = notificationRepository.findByUserOrderByCreatedAtDesc(user);
        list.forEach(n -> n.setReadStatus(true));
        notificationRepository.saveAll(list);
    }
}
