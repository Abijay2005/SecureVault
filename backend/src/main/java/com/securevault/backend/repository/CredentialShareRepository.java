package com.securevault.backend.repository;

import com.securevault.backend.entity.Credential;
import com.securevault.backend.entity.CredentialShare;
import com.securevault.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CredentialShareRepository extends JpaRepository<CredentialShare, Long> {
    List<CredentialShare> findBySharedWithUser(User sharedWithUser);
    List<CredentialShare> findByOwner(User owner);
    Optional<CredentialShare> findByCredentialAndSharedWithUser(Credential credential, User sharedWithUser);
    void deleteByCredential(Credential credential);
}
