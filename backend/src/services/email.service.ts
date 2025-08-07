import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  /**
   * Send an email
   * @param options Email options (to, subject, html)
   * @returns Promise resolving to the sent message info
   */
  async sendEmail(options: EmailOptions): Promise<nodemailer.SentMessageInfo> {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    try {
      return await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Email sending error:', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Generate HTML for repository report email
   * @param data Report data
   * @returns HTML string for email
   */
  generateReportEmail(data: {
    username: string;
    repoName: string;
    startDate: string;
    endDate: string;
    commits: number;
    pullRequests: { opened: number; merged: number; closed: number };
    issues: { opened: number; closed: number };
    contributors: number;
    mergeTime: number;
    dashboardUrl: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DevInsight Weekly Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #4a69bd;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 0 0 5px 5px;
            border: 1px solid #ddd;
            border-top: none;
          }
          .stats {
            margin: 20px 0;
            background-color: white;
            padding: 15px;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .stat-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
          }
          .stat-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
          }
          .stat-label {
            font-weight: bold;
            color: #555;
          }
          .stat-value {
            font-weight: bold;
            color: #4a69bd;
          }
          .button {
            display: inline-block;
            background-color: #4a69bd;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 5px;
            margin-top: 20px;
          }
          .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #777;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>DevInsight Weekly Report</h1>
            <p>${data.repoName}</p>
            <p>${data.startDate} to ${data.endDate}</p>
          </div>
          <div class="content">
            <p>Hello ${data.username},</p>
            <p>Here's your weekly activity summary for <strong>${data.repoName}</strong>:</p>
            
            <div class="stats">
              <div class="stat-row">
                <span class="stat-label">Commits:</span>
                <span class="stat-value">${data.commits}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Pull Requests Opened:</span>
                <span class="stat-value">${data.pullRequests.opened}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Pull Requests Merged:</span>
                <span class="stat-value">${data.pullRequests.merged}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Issues Opened:</span>
                <span class="stat-value">${data.issues.opened}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Issues Closed:</span>
                <span class="stat-value">${data.issues.closed}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Active Contributors:</span>
                <span class="stat-value">${data.contributors}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Average PR Merge Time:</span>
                <span class="stat-value">${data.mergeTime.toFixed(1)} hours</span>
              </div>
            </div>
            
            <p>For more detailed insights and visualizations, visit your dashboard:</p>
            <a href="${data.dashboardUrl}" class="button">View Dashboard</a>
            
            <p>Thank you for using DevInsight!</p>
          </div>
          <div class="footer">
            <p>This is an automated email from DevInsight. To change your email preferences or unsubscribe, visit your account settings.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export default new EmailService();