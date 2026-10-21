package com.securevault.backend.repository;

import com.securevault.backend.entity.Device;
import com.securevault.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DeviceRepository extends JpaRepository<Device, Long> {
    List<Device> findByUserOrderByLastSeenDesc(User user);
    Optional<Device> findByUserAndDeviceFingerprint(User user, String deviceFingerprint);
}
