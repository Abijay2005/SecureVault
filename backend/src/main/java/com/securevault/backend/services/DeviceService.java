package com.securevault.backend.services;

import com.securevault.backend.entity.Device;
import com.securevault.backend.entity.User;
import com.securevault.backend.repository.DeviceRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DeviceService {

    private final DeviceRepository deviceRepository;

    public DeviceService(DeviceRepository deviceRepository) {
        this.deviceRepository = deviceRepository;
    }

    public List<Device> getUserDevices(User user) {
        return deviceRepository.findByUserOrderByLastSeenDesc(user);
    }

    public Device toggleTrust(Long deviceId, User user, boolean trusted) {
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("Device not found"));

        if (!device.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized: You do not own this device record");
        }

        device.setTrusted(trusted);
        return deviceRepository.save(device);
    }

    public void revokeDevice(Long deviceId, User user) {
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("Device not found"));

        if (!device.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized: You do not own this device record");
        }

        deviceRepository.delete(device);
    }
}
