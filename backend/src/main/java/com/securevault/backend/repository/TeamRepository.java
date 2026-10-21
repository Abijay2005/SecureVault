package com.securevault.backend.repository;

import com.securevault.backend.entity.Team;
import com.securevault.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findByOwner(User owner);
}
