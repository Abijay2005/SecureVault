package com.securevault.backend.services;

import com.securevault.backend.entity.Team;
import com.securevault.backend.entity.TeamMember;
import com.securevault.backend.entity.User;
import com.securevault.backend.repository.TeamMemberRepository;
import com.securevault.backend.repository.TeamRepository;
import com.securevault.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;

    public TeamService(TeamRepository teamRepository, TeamMemberRepository teamMemberRepository, UserRepository userRepository) {
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.userRepository = userRepository;
    }

    public Team createTeam(String name, User owner) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Team name cannot be empty");
        }
        Team team = new Team(name.trim(), owner);
        Team saved = teamRepository.save(team);

        // Add owner as ADMIN member
        TeamMember ownerMember = new TeamMember(saved, owner, "ADMIN");
        teamMemberRepository.save(ownerMember);

        return saved;
    }

    public TeamMember addMember(Long teamId, User requester, String memberEmail, String role) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        // Check if requester is owner or ADMIN in team
        boolean isAdmin = team.getOwner().getId().equals(requester.getId()) ||
                teamMemberRepository.findByTeamAndUser(team, requester)
                        .map(m -> "ADMIN".equalsIgnoreCase(m.getRole()))
                        .orElse(false);

        if (!isAdmin) {
            throw new RuntimeException("Unauthorized: Only team admins can add members");
        }

        User newMemberUser = userRepository.findByEmail(memberEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + memberEmail));

        if (teamMemberRepository.findByTeamAndUser(team, newMemberUser).isPresent()) {
            throw new RuntimeException("User is already a member of this team");
        }

        String assignedRole = ("ADMIN".equalsIgnoreCase(role)) ? "ADMIN" : "MEMBER";
        TeamMember member = new TeamMember(team, newMemberUser, assignedRole);
        return teamMemberRepository.save(member);
    }

    public List<Team> getUserTeams(User user) {
        List<TeamMember> memberships = teamMemberRepository.findByUser(user);
        return memberships.stream().map(TeamMember::getTeam).collect(Collectors.toList());
    }

    public List<TeamMember> getTeamMembers(Long teamId, User requester) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        // Requester must be a member
        if (teamMemberRepository.findByTeamAndUser(team, requester).isEmpty() && !team.getOwner().getId().equals(requester.getId())) {
            throw new RuntimeException("Unauthorized: You are not a member of this team");
        }

        return teamMemberRepository.findByTeam(team);
    }
}
