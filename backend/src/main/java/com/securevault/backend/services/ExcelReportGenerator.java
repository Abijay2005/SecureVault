package com.securevault.backend.services;

import com.securevault.backend.dto.ReportDataset;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Service
public class ExcelReportGenerator {

    public byte[] generateExcel(ReportDataset dataset) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet(dataset.getReportType());

            // 1. Cell Styles
            // Title Style
            CellStyle titleStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleFont.setColor(IndexedColors.DARK_BLUE.getIndex());
            titleStyle.setFont(titleFont);

            // Subtitle Style
            CellStyle subStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font subFont = workbook.createFont();
            subFont.setItalic(true);
            subFont.setFontHeightInPoints((short) 10);
            subFont.setColor(IndexedColors.GREY_50_PERCENT.getIndex());
            subStyle.setFont(subFont);

            // Header Style
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 10);
            headerStyle.setFont(headerFont);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);

            // Metric Style
            CellStyle metricStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font metricFont = workbook.createFont();
            metricFont.setBold(true);
            metricFont.setColor(IndexedColors.ROYAL_BLUE.getIndex());
            metricStyle.setFont(metricFont);

            int rowIdx = 0;

            // 2. Title Row
            Row rTitle = sheet.createRow(rowIdx++);
            Cell cTitle = rTitle.createCell(0);
            cTitle.setCellValue("SecureVault — " + dataset.getTitle());
            cTitle.setCellStyle(titleStyle);

            // 3. Metadata Row
            Row rMeta = sheet.createRow(rowIdx++);
            Cell cMeta = rMeta.createCell(0);
            cMeta.setCellValue(String.format("User: %s  |  Generated: %s  |  Type: %s",
                    dataset.getGeneratedForUser(),
                    dataset.getGeneratedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")),
                    dataset.getReportType()));
            cMeta.setCellStyle(subStyle);

            rowIdx++; // Blank spacer row

            // 4. Summary Metrics
            if (dataset.getSummaryMetrics() != null && !dataset.getSummaryMetrics().isEmpty()) {
                Row rMetricHdr = sheet.createRow(rowIdx++);
                Cell cMH = rMetricHdr.createCell(0);
                cMH.setCellValue("SUMMARY METRICS");
                cMH.setCellStyle(headerStyle);

                for (Map.Entry<String, Object> entry : dataset.getSummaryMetrics().entrySet()) {
                    Row rMetric = sheet.createRow(rowIdx++);
                    rMetric.createCell(0).setCellValue(entry.getKey());
                    Cell valCell = rMetric.createCell(1);
                    valCell.setCellValue(String.valueOf(entry.getValue()));
                    valCell.setCellStyle(metricStyle);
                }
                rowIdx++; // Spacer
            }

            // 5. Data Headers
            if (dataset.getColumnHeaders() != null && !dataset.getColumnHeaders().isEmpty()) {
                Row rHeaders = sheet.createRow(rowIdx++);
                for (int c = 0; c < dataset.getColumnHeaders().size(); c++) {
                    Cell cell = rHeaders.createCell(c);
                    cell.setCellValue(dataset.getColumnHeaders().get(c));
                    cell.setCellStyle(headerStyle);
                }

                // 6. Data Rows
                for (var row : dataset.getDataRows()) {
                    Row rData = sheet.createRow(rowIdx++);
                    for (int c = 0; c < row.size(); c++) {
                        Cell cell = rData.createCell(c);
                        cell.setCellValue(row.get(c) != null ? row.get(c) : "");
                    }
                }

                // Auto-size columns
                for (int c = 0; c < dataset.getColumnHeaders().size(); c++) {
                    sheet.autoSizeColumn(c);
                }
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate Excel report: " + e.getMessage(), e);
        }
    }
}
