package com.securevault.backend.services;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class PasswordGeneratorService {

    private static final String UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String LOWER = "abcdefghijklmnopqrstuvwxyz";
    private static final String DIGITS = "0123456789";
    private static final String SYMBOLS = "!@#$%^&*()-_=+[]{}|;:,.<>?";

    private final SecureRandom random = new SecureRandom();

    public static class PasswordOptions {
        private int length = 16;
        private boolean useUpper = true;
        private boolean useLower = true;
        private boolean useDigits = true;
        private boolean useSymbols = true;

        public int getLength() { return length; }
        public void setLength(int length) { this.length = length; }
        public boolean isUseUpper() { return useUpper; }
        public void setUseUpper(boolean useUpper) { this.useUpper = useUpper; }
        public boolean isUseLower() { return useLower; }
        public void setUseLower(boolean useLower) { this.useLower = useLower; }
        public boolean isUseDigits() { return useDigits; }
        public void setUseDigits(boolean useDigits) { this.useDigits = useDigits; }
        public boolean isUseSymbols() { return useSymbols; }
        public void setUseSymbols(boolean useSymbols) { this.useSymbols = useSymbols; }
    }

    public static class StrengthResult {
        private String score; // WEAK, MEDIUM, STRONG, VERY_STRONG
        private int scorePercentage;
        private List<String> suggestions = new ArrayList<>();

        public StrengthResult(String score, int scorePercentage, List<String> suggestions) {
            this.score = score;
            this.scorePercentage = scorePercentage;
            this.suggestions = suggestions;
        }

        public String getScore() { return score; }
        public int getScorePercentage() { return scorePercentage; }
        public List<String> getSuggestions() { return suggestions; }
    }

    public String generatePassword(PasswordOptions options) {
        int length = Math.max(8, Math.min(options.getLength(), 64));
        StringBuilder charPool = new StringBuilder();
        List<Character> guaranteedChars = new ArrayList<>();

        if (options.isUseUpper()) {
            charPool.append(UPPER);
            guaranteedChars.add(UPPER.charAt(random.nextInt(UPPER.length())));
        }
        if (options.isUseLower()) {
            charPool.append(LOWER);
            guaranteedChars.add(LOWER.charAt(random.nextInt(LOWER.length())));
        }
        if (options.isUseDigits()) {
            charPool.append(DIGITS);
            guaranteedChars.add(DIGITS.charAt(random.nextInt(DIGITS.length())));
        }
        if (options.isUseSymbols()) {
            charPool.append(SYMBOLS);
            guaranteedChars.add(SYMBOLS.charAt(random.nextInt(SYMBOLS.length())));
        }

        if (charPool.length() == 0) {
            charPool.append(LOWER).append(DIGITS);
            guaranteedChars.add(LOWER.charAt(random.nextInt(LOWER.length())));
            guaranteedChars.add(DIGITS.charAt(random.nextInt(DIGITS.length())));
        }

        List<Character> passwordChars = new ArrayList<>(guaranteedChars);
        String pool = charPool.toString();

        while (passwordChars.size() < length) {
            passwordChars.add(pool.charAt(random.nextInt(pool.length())));
        }

        Collections.shuffle(passwordChars, random);

        StringBuilder sb = new StringBuilder();
        for (char c : passwordChars) {
            sb.append(c);
        }
        return sb.toString();
    }

    public StrengthResult evaluateStrength(String password) {
        if (password == null || password.isEmpty()) {
            return new StrengthResult("WEAK", 0, List.of("Password cannot be empty"));
        }

        int score = 0;
        List<String> suggestions = new ArrayList<>();

        // Length checks
        if (password.length() >= 8) score += 20;
        else suggestions.add("Use at least 8 characters");

        if (password.length() >= 12) score += 20;
        if (password.length() >= 16) score += 10;

        // Character diversity
        boolean hasUpper = password.chars().anyMatch(Character::isUpperCase);
        boolean hasLower = password.chars().anyMatch(Character::isLowerCase);
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);
        boolean hasSymbol = password.chars().anyMatch(ch -> "!@#$%^&*()-_=+[]{}|;:,.<>?".indexOf(ch) >= 0);

        if (hasUpper) score += 15;
        else suggestions.add("Add uppercase letters (A-Z)");

        if (hasLower) score += 15;
        else suggestions.add("Add lowercase letters (a-z)");

        if (hasDigit) score += 10;
        else suggestions.add("Add numbers (0-9)");

        if (hasSymbol) score += 10;
        else suggestions.add("Add special symbols (!@#$%^&*)");

        score = Math.min(100, score);

        String label;
        if (score < 40) {
            label = "WEAK";
        } else if (score < 70) {
            label = "MEDIUM";
        } else if (score < 90) {
            label = "STRONG";
        } else {
            label = "VERY_STRONG";
        }

        return new StrengthResult(label, score, suggestions);
    }
}
