package com.securevault.backend.services;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.securevault.backend.dto.ReportDataset;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Service
public class PdfReportGenerator {

    private static final Color NAVY_PRIMARY = new Color(15, 23, 42);
    private static final Color CYAN_ACCENT = new Color(2, 132, 199);
    private static final Color TABLE_HEADER_BG = new Color(241, 245, 249);
    private static final Color BORDER_COLOR = new Color(203, 213, 225);

    public byte[] generatePdf(ReportDataset dataset) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate(), 36, 36, 36, 36);
            PdfWriter.getInstance(document, out);
            document.open();

            // 1. Header Banner
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, NAVY_PRIMARY);
            Paragraph title = new Paragraph("SecureVault — " + dataset.getTitle(), titleFont);
            title.setSpacingAfter(4);
            document.add(title);

            Font metaFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.GRAY);
            Paragraph meta = new Paragraph(String.format("Generated for: %s  |  Date: %s  |  Report ID: %s",
                    dataset.getGeneratedForUser(),
                    dataset.getGeneratedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")),
                    dataset.getReportType()), metaFont);
            meta.setSpacingAfter(16);
            document.add(meta);

            // 2. Summary Metrics Cards Table
            if (dataset.getSummaryMetrics() != null && !dataset.getSummaryMetrics().isEmpty()) {
                PdfPTable metricsTable = new PdfPTable(dataset.getSummaryMetrics().size());
                metricsTable.setWidthPercentage(100);
                metricsTable.setSpacingAfter(18);

                Font metricLabelFont = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.DARK_GRAY);
                Font metricValFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, CYAN_ACCENT);

                for (Map.Entry<String, Object> entry : dataset.getSummaryMetrics().entrySet()) {
                    PdfPCell cell = new PdfPCell();
                    cell.setBackgroundColor(TABLE_HEADER_BG);
                    cell.setBorderColor(BORDER_COLOR);
                    cell.setPadding(8);

                    Paragraph pLabel = new Paragraph(entry.getKey(), metricLabelFont);
                    Paragraph pVal = new Paragraph(String.valueOf(entry.getValue()), metricValFont);
                    cell.addElement(pLabel);
                    cell.addElement(pVal);
                    metricsTable.addCell(cell);
                }
                document.add(metricsTable);
            }

            // 3. Tabular Dataset
            if (dataset.getColumnHeaders() != null && !dataset.getColumnHeaders().isEmpty()) {
                int cols = dataset.getColumnHeaders().size();
                PdfPTable dataTable = new PdfPTable(cols);
                dataTable.setWidthPercentage(100);
                dataTable.setHeaderRows(1);

                Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
                for (String header : dataset.getColumnHeaders()) {
                    PdfPCell hCell = new PdfPCell(new Phrase(header, headerFont));
                    hCell.setBackgroundColor(NAVY_PRIMARY);
                    hCell.setBorderColor(NAVY_PRIMARY);
                    hCell.setPadding(6);
                    dataTable.addCell(hCell);
                }

                Font rowFont = FontFactory.getFont(FontFactory.HELVETICA, 8, NAVY_PRIMARY);
                boolean isAlt = false;
                for (var row : dataset.getDataRows()) {
                    Color rowBg = isAlt ? new Color(248, 250, 252) : Color.WHITE;
                    isAlt = !isAlt;

                    for (String val : row) {
                        PdfPCell cell = new PdfPCell(new Phrase(val != null ? val : "-", rowFont));
                        cell.setBackgroundColor(rowBg);
                        cell.setBorderColor(BORDER_COLOR);
                        cell.setPadding(5);
                        dataTable.addCell(cell);
                    }
                }
                document.add(dataTable);
            }

            // 4. Confidentiality Footer
            Font footerFont = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, Color.GRAY);
            Paragraph footer = new Paragraph("\nCONFIDENTIAL & PRIVILEGED — SecureVault Cybersecurity Infrastructure. Zero-Knowledge Encryption.", footerFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF report: " + e.getMessage(), e);
        }
    }
}
