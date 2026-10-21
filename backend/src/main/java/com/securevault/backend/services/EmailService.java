package com.securevault.backend.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:no-reply@securevault.io}")
    private String fromEmail;

    @Value("${app.notifications.email.enabled:false}")
    private boolean emailEnabled;

    public boolean sendEmail(String toEmail, String subject, String body) {
        if (toEmail == null || toEmail.trim().isEmpty()) {
            return false;
        }

        log.info("[EMAIL DISPATCH] To: {} | Subject: {}", toEmail, subject);

        if (mailSender != null && emailEnabled) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(toEmail);
                message.setSubject(subject);
                message.setText(body);
                mailSender.send(message);
                log.info("[EMAIL DISPATCH SUCCESS] Delivered to {}", toEmail);
                return true;
            } catch (Exception e) {
                log.warn("[EMAIL DISPATCH WARN] Failed to send email via SMTP, logged as notification: {}", e.getMessage());
                return false;
            }
        } else {
            // Simulated delivery log for development/test environments
            log.info("[EMAIL SIMULATION] Sent to {} with subject '{}'", toEmail, subject);
            return true;
        }
    }
}
