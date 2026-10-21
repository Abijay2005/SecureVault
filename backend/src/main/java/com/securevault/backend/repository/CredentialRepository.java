package com.securevault.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.securevault.backend.entity.Credential;
import com.securevault.backend.entity.User;
import java.util.List;
import java.util.Optional;

public interface CredentialRepository extends JpaRepository<Credential, Long> {
    List<Credential> findByUser(User user);
    List<Credential> findByUserOrderByUpdatedAtDesc(User user);
    Optional<Credential> findByIdAndUser(Long id, User user);

    List<Credential> findByUserAndIsFavoriteTrueOrderByUpdatedAtDesc(User user);
    List<Credential> findByUserAndCategoryIgnoreCaseOrderByUpdatedAtDesc(User user, String category);
    List<Credential> findByUserAndCredentialTypeIgnoreCaseOrderByUpdatedAtDesc(User user, String credentialType);

    @Query("SELECT c FROM Credential c WHERE c.user = :user AND " +
           "(LOWER(c.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(c.username) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(c.category) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(c.url) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(c.tags) LIKE LOWER(CONCAT('%', :query, '%'))) ORDER BY c.updatedAt DESC")
    List<Credential> searchByUser(@Param("user") User user, @Param("query") String query);

    @Query("SELECT c FROM Credential c WHERE c.user = :user " +
           "AND (:category IS NULL OR LOWER(c.category) = LOWER(:category)) " +
           "AND (:type IS NULL OR LOWER(c.credentialType) = LOWER(:type)) " +
           "AND (:favorite IS NULL OR c.isFavorite = :favorite) " +
           "ORDER BY c.updatedAt DESC")
    List<Credential> filterCredentials(
            @Param("user") User user,
            @Param("category") String category,
            @Param("type") String type,
            @Param("favorite") Boolean favorite
    );
}
