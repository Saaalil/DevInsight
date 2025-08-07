import cron from 'node-cron';
import { User } from '../models/user.model';
import { Repository } from '../models/repository.model';
import { Report } from '../models/report.model';
import { EmailService } from './email.service';
import { getStartOfWeek, getEndOfWeek } from '../utils/dateUtils';
import { ApiError } from '../middleware/error.middleware';

/**
 * Service for handling scheduled tasks using cron jobs
 */
export class CronService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Initialize all cron jobs
   */
  public initCronJobs(): void {
    this.scheduleWeeklyReports();
    console.log('✅ Cron jobs initialized');
  }

  /**
   * Schedule weekly reports to be sent to users
   * Runs every Sunday at 00:00
   */
  private scheduleWeeklyReports(): void {
    // Run every Sunday at 00:00
    cron.schedule('0 0 * * 0', async () => {
      try {
        console.log('Running weekly reports cron job...');
        
        // Find all users with email reports enabled and frequency set to 'weekly'
        const users = await User.find({
          'emailReports.enabled': true,
          'emailReports.frequency': 'weekly'
        });

        console.log(`Found ${users.length} users with weekly reports enabled`);

        // For each user, generate and send reports for all their connected repositories
        for (const user of users) {
          try {
            // Get all repositories connected to this user
            const repositories = await Repository.find({
              users: user._id
            });

            console.log(`Generating reports for user ${user.username} (${repositories.length} repositories)`);

            // Generate a report for each repository
            for (const repo of repositories) {
              try {
                const startDate = getStartOfWeek();
                const endDate = getEndOfWeek();

                // Create a new report
                const report = new Report({
                  user: user._id,
                  repository: repo._id,
                  reportType: 'weekly',
                  startDate,
                  endDate,
                  reportData: {
                    commits: repo.metrics.commits,
                    pullRequests: repo.metrics.pullRequests,
                    issues: repo.metrics.issues,
                    contributors: repo.metrics.contributors,
                    mergeTime: repo.metrics.mergeTime
                  },
                  sent: false
                });

                await report.save();

                // Generate and send the email
                const emailContent = await this.emailService.generateReportEmail(user, repo, report);
                await this.emailService.sendEmail(
                  user.email,
                  `Weekly Report for ${repo.fullName}`,
                  emailContent
                );

                // Update the report as sent
                report.sent = true;
                await report.save();

                console.log(`Report sent for ${repo.fullName} to ${user.email}`);
              } catch (error) {
                console.error(`Error generating report for repository ${repo.fullName}:`, error);
              }
            }
          } catch (error) {
            console.error(`Error processing reports for user ${user.username}:`, error);
          }
        }

        console.log('Weekly reports cron job completed');
      } catch (error) {
        console.error('Error in weekly reports cron job:', error);
      }
    });
  }
}