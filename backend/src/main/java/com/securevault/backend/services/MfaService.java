package com.securevault.backend.services;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.securevault.backend.entity.User;
import com.securevault.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.ByteArrayOutputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class MfaService {

    private static final Logger log = LoggerFactory.getLogger(MfaService.class);
    private static final String BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private static final int[] BASE32_LOOKUP = new int[128];

    static {
        Arrays.fill(BASE32_LOOKUP, -1);
        for (int i = 0; i < BASE32_CHARS.length(); i++) {
            BASE32_LOOKUP[BASE32_CHARS.charAt(i)] = i;
            if (Character.isLetter(BASE32_CHARS.charAt(i))) {
                BASE32_LOOKUP[Character.toLowerCase(BASE32_CHARS.charAt(i))] = i;
            }
        }
    }

    private final UserRepository userRepository;
    private final EmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.mfa.dev-mode:false}")
    private boolean devMode;

    @Value("${app.mfa.issuer:SecureVault}")
    private String issuer = "SecureVault";

    // Cache of active pending MFA challenges (challengeToken -> ChallengeInfo)
    private final Map<String, ChallengeInfo> pendingChallenges = new ConcurrentHashMap<>();

    // Cache of active MFA setup attempts awaiting verification (email -> PendingSetup)
    private final Map<String, PendingSetup> pendingSetups = new ConcurrentHashMap<>();

    public static class ChallengeInfo {
        String email;
        String code;
        long expiryTime;

        ChallengeInfo(String email, String code, long expiryTime) {
            this.email = email;
            this.code = code;
            this.expiryTime = expiryTime;
        }

        public String getEmail() { return email; }
        public String getCode() { return code; }
        public long getExpiryTime() { return expiryTime; }
    }

    public static class PendingSetup {
        private final String base32Secret;
        private final List<String> backupCodes;
        private final long expiryTime;

        PendingSetup(String base32Secret, List<String> backupCodes, long expiryTime) {
            this.base32Secret = base32Secret;
            this.backupCodes = backupCodes;
            this.expiryTime = expiryTime;
        }

        public String getBase32Secret() { return base32Secret; }
        public List<String> getBackupCodes() { return backupCodes; }
        public boolean isExpired() { return System.currentTimeMillis() > expiryTime; }
    }

    public static class SetupData {
        private final String secretKey;
        private final String formattedKey;
        private final String qrCodeDataUrl;
        private final String otpauthUri;
        private final List<String> backupCodes;

        public SetupData(String secretKey, String formattedKey, String qrCodeDataUrl, String otpauthUri, List<String> backupCodes) {
            this.secretKey = secretKey;
            this.formattedKey = formattedKey;
            this.qrCodeDataUrl = qrCodeDataUrl;
            this.otpauthUri = otpauthUri;
            this.backupCodes = backupCodes;
        }

        public String getSecretKey() { return secretKey; }
        public String getFormattedKey() { return formattedKey; }
        public String getQrCodeDataUrl() { return qrCodeDataUrl; }
        public String getOtpauthUri() { return otpauthUri; }
        public List<String> getBackupCodes() { return backupCodes; }
    }

    public MfaService(UserRepository userRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    public boolean isDevMode() {
        return devMode;
    }

    public void setDevMode(boolean devMode) {
        this.devMode = devMode;
    }

    /**
     * Initializes a production TOTP setup with Base32 secret, QR code, and backup codes.
     */
    public SetupData initiateMfaSetup(User user) {
        // Generate 20 random bytes for Base32 TOTP secret (160-bit security)
        byte[] secretBytes = new byte[20];
        secureRandom.nextBytes(secretBytes);
        String base32Secret = encodeBase32(secretBytes);

        // Generate 8 single-use backup recovery codes
        List<String> backupCodes = generateBackupCodes(8);

        // Build standard otpauth URI
        String safeIssuer = (issuer != null && !issuer.trim().isEmpty()) ? issuer : "SecureVault";
        String safeEmail = (user.getEmail() != null && !user.getEmail().trim().isEmpty()) ? user.getEmail() : "user@securevault.io";
        String encodedIssuer = URLEncoder.encode(safeIssuer, StandardCharsets.UTF_8).replace("+", "%20");
        String encodedEmail = URLEncoder.encode(safeEmail, StandardCharsets.UTF_8).replace("+", "%20");
        String otpauthUri = String.format("otpauth://totp/%s:%s?secret=%s&issuer=%s&algorithm=SHA1&digits=6&period=30",
                encodedIssuer, encodedEmail, base32Secret, encodedIssuer);

        // Generate QR code data URL (PNG)
        String qrCodeDataUrl = generateQrCodeDataUrl(otpauthUri, 240, 240);

        // Cache pending setup for 15 minutes
        pendingSetups.put(user.getEmail(), new PendingSetup(base32Secret, backupCodes, System.currentTimeMillis() + (15 * 60 * 1000)));

        String formattedKey = formatSecretKey(base32Secret);
        return new SetupData(base32Secret, formattedKey, qrCodeDataUrl, otpauthUri, backupCodes);
    }

    /**
     * Confirms and activates MFA after validating the user's first 6-digit TOTP code.
     */
    public List<String> enableMfa(User user, String verificationCode) {
        if (verificationCode == null || verificationCode.trim().isEmpty()) {
            throw new RuntimeException("Verification code is required.");
        }

        PendingSetup pending = pendingSetups.get(user.getEmail());
        if (pending == null || pending.isExpired()) {
            // Check if user already had a secret saved earlier
            if (user.getMfaSecret() != null && verifyTotp(user.getMfaSecret(), verificationCode)) {
                user.setMfaEnabled(true);
                userRepository.save(user);
                return getParsedBackupCodes(user.getMfaBackupCodes());
            }
            throw new RuntimeException("MFA setup session expired or not found. Please initiate setup again.");
        }

        boolean valid = verifyTotp(pending.getBase32Secret(), verificationCode);
        if (!valid) {
            // Also accept backup code or exact code for fallback
            if (!pending.getBackupCodes().contains(verificationCode.trim())) {
                throw new RuntimeException("Invalid authenticator code. Check the current code in your app and try again.");
            }
        }

        user.setMfaSecret(pending.getBase32Secret());
        user.setMfaBackupCodes(String.join(",", pending.getBackupCodes()));
        user.setMfaEnabled(true);
        userRepository.save(user);

        pendingSetups.remove(user.getEmail());
        log.info("[MFA ENABLED] Two-Factor Authentication activated for user: {}", user.getEmail());
        return pending.getBackupCodes();
    }

    /**
     * Disables MFA for the user and clears secret and backup codes.
     */
    public void disableMfa(User user) {
        user.setMfaEnabled(false);
        user.setMfaSecret(null);
        user.setMfaBackupCodes(null);
        userRepository.save(user);
        pendingSetups.remove(user.getEmail());
        log.info("[MFA DISABLED] Two-Factor Authentication removed for user: {}", user.getEmail());
    }

    /**
     * Creates a login MFA challenge, issues an Email OTP fallback, and stores challenge info.
     */
    public String createMfaChallenge(String email) {
        String challengeToken = "CHAL-" + UUID.randomUUID().toString();
        String code = String.format("%06d", secureRandom.nextInt(1000000));

        // Valid for 5 minutes
        pendingChallenges.put(challengeToken, new ChallengeInfo(email, code, System.currentTimeMillis() + (5 * 60 * 1000)));

        // Send Email OTP Notification
        sendMfaEmailOtp(email, code);

        return challengeToken;
    }

    private void sendMfaEmailOtp(String email, String code) {
        try {
            String subject = "SecureVault - Your Sign-In Verification Code";
            String body = String.format(
                    "Hello,\n\n" +
                    "A sign-in attempt was initiated for your SecureVault account.\n\n" +
                    "Your single-use verification code is:\n" +
                    "-----------------------------------\n" +
                    "           %s\n" +
                    "-----------------------------------\n\n" +
                    "This code is valid for 5 minutes.\n\n" +
                    "If you use an authenticator app (Google Authenticator, Microsoft Authenticator), you can also enter the live 6-digit code from your app.\n\n" +
                    "If you did not attempt this sign-in, someone may know your password. Please sign in immediately and change your master password.\n\n" +
                    "SecureVault Security Team",
                    code
            );
            emailService.sendEmail(email, subject, body);
        } catch (Exception e) {
            log.warn("[MFA EMAIL WARN] Failed to dispatch MFA code email to {}: {}", email, e.getMessage());
        }
    }

    public String getPendingChallengeCode(String challengeToken) {
        ChallengeInfo info = pendingChallenges.get(challengeToken);
        return info != null ? info.code : null;
    }

    public String getEmailForChallenge(String challengeToken) {
        ChallengeInfo info = pendingChallenges.get(challengeToken);
        return info != null ? info.email : null;
    }

    /**
     * Production verification:
     * 1. Validates against User's Live TOTP (Google/Microsoft Authenticator app).
     * 2. Validates against Email OTP challenge code.
     * 3. Validates against one of the single-use backup recovery codes.
     */
    public boolean verifyMfaChallenge(String challengeToken, String inputCode) {
        if (challengeToken == null || inputCode == null || inputCode.trim().isEmpty()) {
            return false;
        }

        ChallengeInfo info = pendingChallenges.get(challengeToken);
        if (info == null || System.currentTimeMillis() > info.expiryTime) {
            if (info != null) pendingChallenges.remove(challengeToken);
            return false;
        }

        String cleanCode = inputCode.trim();
        User user = userRepository.findByEmail(info.email).orElse(null);

        boolean verified = false;

        // 1. Verify TOTP from Authenticator app
        if (user != null && user.getMfaSecret() != null) {
            if (verifyTotp(user.getMfaSecret(), cleanCode)) {
                verified = true;
                log.info("[MFA SUCCESS] Verified via TOTP Authenticator for {}", info.email);
            }
        }

        // 2. Verify Email OTP challenge code
        if (!verified && cleanCode.equals(info.code)) {
            verified = true;
            log.info("[MFA SUCCESS] Verified via Email OTP for {}", info.email);
        }

        // 3. Verify Single-use Backup Recovery Code
        if (!verified && user != null && user.getMfaBackupCodes() != null) {
            List<String> codes = new ArrayList<>(getParsedBackupCodes(user.getMfaBackupCodes()));
            Iterator<String> it = codes.iterator();
            while (it.hasNext()) {
                String bc = it.next();
                if (bc.equalsIgnoreCase(cleanCode) || bc.replace("-", "").equalsIgnoreCase(cleanCode.replace("-", ""))) {
                    it.remove();
                    user.setMfaBackupCodes(String.join(",", codes));
                    userRepository.save(user);
                    verified = true;
                    log.info("[MFA SUCCESS] Verified via single-use Backup Recovery Code for {}", info.email);
                    break;
                }
            }
        }

        // 4. Legacy fallback for existing mock 6-digit secrets
        if (!verified && user != null && user.getMfaSecret() != null && cleanCode.equals(user.getMfaSecret())) {
            verified = true;
            log.info("[MFA SUCCESS] Verified via legacy key match for {}", info.email);
        }

        if (verified) {
            pendingChallenges.remove(challengeToken);
            return true;
        }

        log.warn("[MFA FAILED] Invalid MFA code provided for {}", info.email);
        return false;
    }

    /**
     * Regenerates a new set of 8 backup codes for an MFA-enabled user.
     */
    public List<String> regenerateBackupCodes(User user) {
        if (!user.isMfaEnabled()) {
            throw new RuntimeException("MFA is not enabled on this account.");
        }
        List<String> newCodes = generateBackupCodes(8);
        user.setMfaBackupCodes(String.join(",", newCodes));
        userRepository.save(user);
        return newCodes;
    }

    // --- RFC 6238 TOTP Engine ---

    public boolean verifyTotp(String base32Secret, String inputCode) {
        if (base32Secret == null || inputCode == null) return false;
        String cleanCode = inputCode.trim().replaceAll("\\s+", "");
        if (cleanCode.length() != 6) return false;

        byte[] keyBytes = decodeBase32(base32Secret);
        if (keyBytes.length == 0) {
            // If secret is not Base32 (e.g. legacy plain text code), test direct equality
            return base32Secret.equals(cleanCode);
        }

        long currentWindow = System.currentTimeMillis() / 1000L / 30L;
        // Window check: -1, 0, +1 (±30s time drift tolerance)
        for (int i = -1; i <= 1; i++) {
            long timeWindow = currentWindow + i;
            String generated = generateTotpForWindow(keyBytes, timeWindow);
            if (cleanCode.equals(generated)) {
                return true;
            }
        }
        return false;
    }

    private String generateTotpForWindow(byte[] key, long timeWindow) {
        try {
            byte[] data = new byte[8];
            for (int i = 7; i >= 0; i--) {
                data[i] = (byte) (timeWindow & 0xff);
                timeWindow >>= 8;
            }
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key, "HmacSHA1"));
            byte[] hash = mac.doFinal(data);

            int offset = hash[hash.length - 1] & 0x0f;
            int binary = ((hash[offset] & 0x7f) << 24)
                    | ((hash[offset + 1] & 0xff) << 16)
                    | ((hash[offset + 2] & 0xff) << 8)
                    | (hash[offset + 3] & 0xff);

            int otp = binary % 1000000;
            return String.format("%06d", otp);
        } catch (Exception e) {
            log.error("[TOTP ERROR] Error computing TOTP code: {}", e.getMessage());
            return "";
        }
    }

    // --- Base32 Utility Methods ---

    public static String encodeBase32(byte[] data) {
        StringBuilder result = new StringBuilder();
        int buffer = 0;
        int next = 0;
        int bitsLeft = 0;
        while (next < data.length) {
            buffer = (buffer << 8) | (data[next++] & 0xff);
            bitsLeft += 8;
            while (bitsLeft >= 5) {
                bitsLeft -= 5;
                result.append(BASE32_CHARS.charAt((buffer >> bitsLeft) & 0x1f));
            }
        }
        if (bitsLeft > 0) {
            buffer <<= (5 - bitsLeft);
            result.append(BASE32_CHARS.charAt(buffer & 0x1f));
        }
        return result.toString();
    }

    public static byte[] decodeBase32(String base32) {
        if (base32 == null) return new byte[0];
        String clean = base32.replace(" ", "").replace("-", "").toUpperCase().replaceAll("=+$", "");
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        int buffer = 0;
        int bitsLeft = 0;
        for (char c : clean.toCharArray()) {
            if (c >= BASE32_LOOKUP.length || BASE32_LOOKUP[c] < 0) {
                continue;
            }
            buffer = (buffer << 5) | (BASE32_LOOKUP[c] & 0x1f);
            bitsLeft += 5;
            if (bitsLeft >= 8) {
                bitsLeft -= 8;
                out.write((buffer >> bitsLeft) & 0xff);
            }
        }
        return out.toByteArray();
    }

    private String formatSecretKey(String key) {
        if (key == null) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < key.length(); i++) {
            if (i > 0 && i % 4 == 0) {
                sb.append(" ");
            }
            sb.append(key.charAt(i));
        }
        return sb.toString();
    }

    private String generateQrCodeDataUrl(String text, int width, int height) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(text, BarcodeFormat.QR_CODE, width, height);
            ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
            String base64Image = Base64.getEncoder().encodeToString(pngOutputStream.toByteArray());
            return "data:image/png;base64," + base64Image;
        } catch (Exception e) {
            log.error("[QR CODE ERROR] Failed to generate QR code: {}", e.getMessage());
            return "";
        }
    }

    private List<String> generateBackupCodes(int count) {
        List<String> list = new ArrayList<>(count);
        String charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        for (int i = 0; i < count; i++) {
            StringBuilder sb = new StringBuilder();
            for (int j = 0; j < 8; j++) {
                if (j == 4) sb.append("-");
                sb.append(charset.charAt(secureRandom.nextInt(charset.length())));
            }
            list.add(sb.toString());
        }
        return list;
    }

    private List<String> getParsedBackupCodes(String csv) {
        if (csv == null || csv.trim().isEmpty()) return Collections.emptyList();
        return Arrays.asList(csv.split(","));
    }
}
