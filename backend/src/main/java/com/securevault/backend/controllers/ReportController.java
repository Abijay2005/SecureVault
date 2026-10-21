package com.securevault.backend.controllers;

import com.securevault.backend.dto.ReportDataset;
import com.securevault.backend.entity.User;
import com.securevault.backend.repository.UserRepository;
import com.securevault.backend.services.ExcelReportGenerator;
import com.securevault.backend.services.JwtService;
import com.securevault.backend.services.PdfReportGenerator;
import com.securevault.backend.services.ReportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;
    private final PdfReportGenerator pdfReportGenerator;
    private final ExcelReportGenerator excelReportGenerator;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    public static final List<String> REPORT_TYPES = Arrays.asList(
            "SECURITY_REPORT", "PASSWORD_HEALTH", "AUDIT_REPORT", "USER_ACTIVITY", "THREAT_MONITORING"
    );

    public ReportController(ReportService reportService,
                            PdfReportGenerator pdfReportGenerator,
                            ExcelReportGenerator excelReportGenerator,
                            JwtService jwtService,
                            UserRepository userRepository) {
        this.reportService = reportService;
        this.pdfReportGenerator = pdfReportGenerator;
        this.excelReportGenerator = excelReportGenerator;
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

    @GetMapping("/types")
    public ResponseEntity<?> getReportTypes() {
        return ResponseEntity.ok(REPORT_TYPES);
    }

    @GetMapping("/{type}/data")
    public ResponseEntity<?> getReportData(
            @PathVariable String type,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        try {
            User user = getAuthenticatedUser(authorization);
            ReportDataset dataset = reportService.generateReport(user, type);
            return ResponseEntity.ok(dataset);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{type}/export/pdf")
    public ResponseEntity<?> exportPdf(
            @PathVariable String type,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        try {
            User user = getAuthenticatedUser(authorization);
            ReportDataset dataset = reportService.generateReport(user, type);
            byte[] pdfBytes = pdfReportGenerator.generatePdf(dataset);

            String filename = String.format("SecureVault_%s_%s.pdf", type.toLowerCase(), System.currentTimeMillis());

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{type}/export/excel")
    public ResponseEntity<?> exportExcel(
            @PathVariable String type,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        try {
            User user = getAuthenticatedUser(authorization);
            ReportDataset dataset = reportService.generateReport(user, type);
            byte[] excelBytes = excelReportGenerator.generateExcel(dataset);

            String filename = String.format("SecureVault_%s_%s.xlsx", type.toLowerCase(), System.currentTimeMillis());

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(excelBytes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }
}
