package com.securevault.backend.controllers;

import com.securevault.backend.entity.User;
import com.securevault.backend.repository.UserRepository;
import com.securevault.backend.services.AdminService;
import com.securevault.backend.services.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    public AdminController(AdminService adminService, JwtService jwtService, UserRepository userRepository) {
        this.adminService = adminService;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
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

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        try {
            User user = getAuthenticatedUser(authorization);
            List<User> users = adminService.getAllUsers(user);
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<?> updateUserRole(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody Map<String, String> payload) {
        try {
            User user = getAuthenticatedUser(authorization);
            String role = payload.get("role");
            User updated = adminService.updateUserRole(user, id, role);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getSystemStats(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        try {
            User user = getAuthenticatedUser(authorization);
            Map<String, Object> stats = adminService.getSystemStats(user);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        }
    }
}
