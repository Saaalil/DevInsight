import { Report } from '../models/report.model';
import { Repository } from '../models/repository.model';
import { formatDate } from './dateUtils';

/**
 * Generate CSV content for a repository report
 * @param report The report document
 * @param repository The repository document
 * @returns CSV content as a string
 */
export const generateReportCsv = async (report: any, repository: any): Promise<string> => {
  // CSV header
  let csv = 'Metric,Value,Details\n';
  
  // Repository information
  csv += `Repository,${repository.fullName},${repository.description || 'No description'}\n`;
  csv += `Report Period,${formatDate(report.startDate)} to ${formatDate(report.endDate)},${report.reportType} report\n`;
  csv += `Generated On,${formatDate(report.createdAt)},\n`;
  csv += '\n';
  
  // Metrics section
  csv += 'METRICS SUMMARY,\n';
  
  // Commits
  if (report.reportData.commits) {
    csv += `Total Commits,${report.reportData.commits.total},\n`;
    
    // Commit authors
    if (report.reportData.commits.byAuthor && report.reportData.commits.byAuthor.length > 0) {
      csv += 'Commits by Author,\n';
      report.reportData.commits.byAuthor.forEach((author: any) => {
        csv += `,${author.name},${author.count} commits\n`;
      });
    }
    
    // Commit activity by day
    if (report.reportData.commits.byDay && report.reportData.commits.byDay.length > 0) {
      csv += 'Commits by Day,\n';
      report.reportData.commits.byDay.forEach((day: any) => {
        csv += `,${day.date},${day.count} commits\n`;
      });
    }
  }
  
  // Pull Requests
  if (report.reportData.pullRequests) {
    csv += `\nPull Requests,${report.reportData.pullRequests.total},\n`;
    csv += `Open Pull Requests,${report.reportData.pullRequests.open},\n`;
    csv += `Closed Pull Requests,${report.reportData.pullRequests.closed},\n`;
    csv += `Merged Pull Requests,${report.reportData.pullRequests.merged},\n`;
    csv += `Average Merge Time,${report.reportData.mergeTime ? report.reportData.mergeTime.toFixed(2) + ' hours' : 'N/A'},\n`;
  }
  
  // Issues
  if (report.reportData.issues) {
    csv += `\nIssues,${report.reportData.issues.total},\n`;
    csv += `Open Issues,${report.reportData.issues.open},\n`;
    csv += `Closed Issues,${report.reportData.issues.closed},\n`;
  }
  
  // Contributors
  if (report.reportData.contributors && report.reportData.contributors.length > 0) {
    csv += '\nContributors,\n';
    report.reportData.contributors.forEach((contributor: any, index: number) => {
      csv += `,${contributor.name},${contributor.contributions} contributions\n`;
    });
  }
  
  return csv;
};