package com.securevault.backend.repository;

import com.securevault.backend.entity.Credential;
import com.securevault.backend.entity.Team;
import com.securevault.backend.entity.TeamCredentialShare;
import com.securevault.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamCredentialShareRepository extends JpaRepository<TeamCredentialShare, Long> {
    List<TeamCredentialShare> findByTeam(Team team);
    List<TeamCredentialShare> findByTeamIn(List<Team> teams);
    List<TeamCredentialShare> findByOwner(User owner);
    Optional<TeamCredentialShare> findByCredentialAndTeam(Credential credential, Team team);
    void deleteByCredential(Credential credential);
}
