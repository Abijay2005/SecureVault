package com.securevault.backend.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class ReportDataset {
    private String reportType;
    private String title;
    private String generatedForUser;
    private LocalDateTime generatedAt;
    private Map<String, Object> summaryMetrics;
    private List<String> columnHeaders;
    private List<List<String>> dataRows;

    public ReportDataset() {
        this.generatedAt = LocalDateTime.now();
    }

    public ReportDataset(String reportType, String title, String generatedForUser,
                         Map<String, Object> summaryMetrics,
                         List<String> columnHeaders, List<List<String>> dataRows) {
        this.reportType = reportType;
        this.title = title;
        this.generatedForUser = generatedForUser;
        this.generatedAt = LocalDateTime.now();
        this.summaryMetrics = summaryMetrics;
        this.columnHeaders = columnHeaders;
        this.dataRows = dataRows;
    }

    public String getReportType() { return reportType; }
    public void setReportType(String reportType) { this.reportType = reportType; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getGeneratedForUser() { return generatedForUser; }
    public void setGeneratedForUser(String generatedForUser) { this.generatedForUser = generatedForUser; }

    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }

    public Map<String, Object> getSummaryMetrics() { return summaryMetrics; }
    public void setSummaryMetrics(Map<String, Object> summaryMetrics) { this.summaryMetrics = summaryMetrics; }

    public List<String> getColumnHeaders() { return columnHeaders; }
    public void setColumnHeaders(List<String> columnHeaders) { this.columnHeaders = columnHeaders; }

    public List<List<String>> getDataRows() { return dataRows; }
    public void setDataRows(List<List<String>> dataRows) { this.dataRows = dataRows; }
}
