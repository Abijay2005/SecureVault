package com.securevault.backend.controllers;

import com.securevault.backend.entity.Team;
import com.securevault.backend.entity.TeamMember;
import com.securevault.backend.entity.User;
import com.securevault.backend.repository.UserRepository;
import com.securevault.backend.services.JwtService;
import com.securevault.backend.services.TeamService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teams")
public class TeamController {

    private final TeamService teamService;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    public TeamController(TeamService teamService, JwtService jwtService, UserRepository userRepository) {
        this.teamService = teamService;
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

    public static class CreateTeamRequest {
        public String name;
    }

    public static class AddMemberRequest {
        public String email;
        public String role = "MEMBER";
    }

    @PostMapping
    public ResponseEntity<?> createTeam(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody CreateTeamRequest request) {
        try {
            User user = getAuthenticatedUser(authorization);
            Team team = teamService.createTeam(request.name, user);
            return ResponseEntity.status(HttpStatus.CREATED).body(team);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getUserTeams(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        try {
            User user = getAuthenticatedUser(authorization);
            List<Team> teams = teamService.getUserTeams(user);
            return ResponseEntity.ok(teams);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{teamId}/members")
    public ResponseEntity<?> addMember(
            @PathVariable Long teamId,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody AddMemberRequest request) {
        try {
            User user = getAuthenticatedUser(authorization);
            TeamMember member = teamService.addMember(teamId, user, request.email, request.role);
            return ResponseEntity.status(HttpStatus.CREATED).body(member);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{teamId}/members")
    public ResponseEntity<?> getTeamMembers(
            @PathVariable Long teamId,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        try {
            User user = getAuthenticatedUser(authorization);
            List<TeamMember> members = teamService.getTeamMembers(teamId, user);
            return ResponseEntity.ok(members);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }
}
