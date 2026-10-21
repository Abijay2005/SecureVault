package com.securevault.backend.controllers;

import com.securevault.backend.services.PasswordGeneratorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/tools/password")
public class PasswordToolController {

    private final PasswordGeneratorService passwordGeneratorService;

    public PasswordToolController(PasswordGeneratorService passwordGeneratorService) {
        this.passwordGeneratorService = passwordGeneratorService;
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generatePassword(@RequestBody(required = false) PasswordGeneratorService.PasswordOptions options) {
        if (options == null) {
            options = new PasswordGeneratorService.PasswordOptions();
        }
        String password = passwordGeneratorService.generatePassword(options);
        PasswordGeneratorService.StrengthResult strength = passwordGeneratorService.evaluateStrength(password);
        return ResponseEntity.ok(Map.of(
                "password", password,
                "strength", strength
        ));
    }

    @PostMapping("/strength")
    public ResponseEntity<?> evaluateStrength(@RequestBody Map<String, String> payload) {
        String password = payload.getOrDefault("password", "");
        PasswordGeneratorService.StrengthResult strength = passwordGeneratorService.evaluateStrength(password);
        return ResponseEntity.ok(strength);
    }
}
