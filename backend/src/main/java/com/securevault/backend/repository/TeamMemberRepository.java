package com.securevault.backend.repository;

import com.securevault.backend.entity.Team;
import com.securevault.backend.entity.TeamMember;
import com.securevault.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
    List<TeamMember> findByUser(User user);
    List<TeamMember> findByTeam(Team team);
    Optional<TeamMember> findByTeamAndUser(Team team, User user);
}
