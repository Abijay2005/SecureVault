package com.securevault.backend.services;

import com.securevault.backend.entity.Credential;
import com.securevault.backend.entity.User;
import com.securevault.backend.repository.CredentialRepository;
import com.securevault.backend.repository.CredentialShareRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
public class CredentialService {

    private final CredentialRepository credentialRepository;
    private final CredentialShareRepository credentialShareRepository;
    private final EncryptionService encryptionService;

    public static final List<String> CATEGORIES = Arrays.asList(
            "General", "Work", "Personal", "Finance", "Social", "Development", "Cloud", "Entertainment"
    );

    public static final List<String> CREDENTIAL_TYPES = Arrays.asList(
            "LOGIN", "SECURE_NOTE", "API_KEY", "CREDIT_CARD", "SERVER_CREDENTIAL"
    );

    public CredentialService(CredentialRepository credentialRepository,
                             CredentialShareRepository credentialShareRepository,
                             EncryptionService encryptionService) {
        this.credentialRepository = credentialRepository;
        this.credentialShareRepository = credentialShareRepository;
        this.encryptionService = encryptionService;
    }

    public Credential createCredential(Credential credential, User user) {
        credential.setUser(user);
        if (credential.getPassword() != null && !credential.getPassword().isEmpty()) {
            credential.setPassword(encryptionService.encrypt(credential.getPassword()));
        }
        if (credential.getNotes() != null && !credential.getNotes().isEmpty()) {
            credential.setNotes(encryptionService.encrypt(credential.getNotes()));
        }
        credential.setCreatedAt(LocalDateTime.now());
        credential.setUpdatedAt(LocalDateTime.now());

        Credential saved = credentialRepository.save(credential);
        return decryptCredential(saved);
    }

    public List<Credential> getUserCredentials(User user) {
        List<Credential> list = credentialRepository.findByUserOrderByUpdatedAtDesc(user);
        list.forEach(this::decryptCredential);
        return list;
    }

    public Credential getCredentialById(Long id, User user) {
        Credential credential = credentialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Credential not found"));
        if (!credential.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized: You do not own this credential");
        }
        return decryptCredential(credential);
    }

    public Credential updateCredential(Long id, User user, Credential updatedCredential) {
        Credential credential = credentialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Credential not found"));

        if (!credential.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized: You do not have permission to update this credential");
        }

        if (updatedCredential.getTitle() != null) {
            credential.setTitle(updatedCredential.getTitle());
        }
        if (updatedCredential.getUsername() != null) {
            credential.setUsername(updatedCredential.getUsername());
        }
        if (updatedCredential.getPassword() != null && !updatedCredential.getPassword().isEmpty()) {
            credential.setPassword(encryptionService.encrypt(updatedCredential.getPassword()));
        }
        if (updatedCredential.getCategory() != null) {
            credential.setCategory(updatedCredential.getCategory());
        }
        if (updatedCredential.getCredentialType() != null) {
            credential.setCredentialType(updatedCredential.getCredentialType());
        }
        if (updatedCredential.getIsFavorite() != null) {
            credential.setIsFavorite(updatedCredential.getIsFavorite());
        }
        if (updatedCredential.getNotes() != null) {
            credential.setNotes(encryptionService.encrypt(updatedCredential.getNotes()));
        }
        if (updatedCredential.getUrl() != null) {
            credential.setUrl(updatedCredential.getUrl());
        }
        if (updatedCredential.getTags() != null) {
            credential.setTags(updatedCredential.getTags());
        }
        credential.setUpdatedAt(LocalDateTime.now());

        Credential saved = credentialRepository.save(credential);
        return decryptCredential(saved);
    }

    public Credential toggleFavorite(Long id, User user) {
        Credential credential = credentialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Credential not found"));

        if (!credential.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized: You do not own this credential");
        }

        credential.setIsFavorite(!credential.getIsFavorite());
        credential.setUpdatedAt(LocalDateTime.now());
        Credential saved = credentialRepository.save(credential);
        return decryptCredential(saved);
    }

    public List<Credential> searchCredentials(User user, String query) {
        if (query == null || query.trim().isEmpty()) {
            return getUserCredentials(user);
        }
        List<Credential> list = credentialRepository.searchByUser(user, query.trim());
        list.forEach(this::decryptCredential);
        return list;
    }

    public List<Credential> filterCredentials(User user, String category, String type, Boolean favorite) {
        String cleanCategory = (category != null && !category.trim().isEmpty() && !category.equalsIgnoreCase("ALL")) ? category.trim() : null;
        String cleanType = (type != null && !type.trim().isEmpty() && !type.equalsIgnoreCase("ALL")) ? type.trim() : null;

        List<Credential> list = credentialRepository.filterCredentials(user, cleanCategory, cleanType, favorite);
        list.forEach(this::decryptCredential);
        return list;
    }

    @Transactional
    public void deleteCredential(Long id, User user) {
        Credential credential = credentialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Credential not found"));

        if (!credential.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized: You do not have permission to delete this credential");
        }

        credentialShareRepository.deleteByCredential(credential);
        credentialRepository.delete(credential);
    }

    public Credential decryptCredential(Credential credential) {
        if (credential != null) {
            if (credential.getPassword() != null) {
                credential.setPassword(encryptionService.decrypt(credential.getPassword()));
            }
            if (credential.getNotes() != null) {
                credential.setNotes(encryptionService.decrypt(credential.getNotes()));
            }
        }
        return credential;
    }
}