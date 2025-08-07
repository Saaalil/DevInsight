import { Request, Response } from 'express';
import User from '../models/user.model';
import Repository, { IRepository } from '../models/repository.model';
import Report from '../models/report.model';
import { EmailService } from '../services/email.service';
import asyncHandler from '../utils/asyncHandler';
import { ApiError } from '../middleware/error.middleware';
import { formatDate, getStartOfWeek, getEndOfWeek } from '../utils/dateUtils';

/**
 * @desc    Get user's report settings
 * @route   GET /api/report/settings
 * @access  Private
 */
export const getReportSettings = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user._id).select('emailReports');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.status(200).json(user.emailReports);
});

/**
 * @desc    Update user's report settings
 * @route   PUT /api/report/settings
 * @access  Private
 */
export const updateReportSettings = asyncHandler(async (req: Request, res: Response) => {
  const { enabled, frequency } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Update email report settings
  user.emailReports.enabled = enabled !== undefined ? enabled : user.emailReports.enabled;
  
  if (frequency && ['daily', 'weekly', 'monthly'].includes(frequency)) {
    user.emailReports.frequency = frequency as 'daily' | 'weekly' | 'monthly';
  }

  await user.save();

  res.status(200).json(user.emailReports);
});

/**
 * @desc    Get all reports for a user
 * @route   GET /api/report
 * @access  Private
 */
export const getUserReports = asyncHandler(async (req: Request, res: Response) => {
  const reports = await Report.find({ user: req.user._id })
    .populate('repository', 'name fullName owner description url')
    .sort({ createdAt: -1 });

  res.status(200).json(reports);
});

/**
 * @desc    Get a specific report by ID
 * @route   GET /api/report/:id
 * @access  Private
 */
export const getReportById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const report = await Report.findById(id)
    .populate('repository', 'name fullName owner description url')
    .populate('user', 'username email');

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  // Check if the report belongs to the user
  if (report.user._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized to access this report');
  }

  res.status(200).json(report);
});

/**
 * @desc    Generate and send a report for a repository
 * @route   POST /api/report/generate/:repoId
 * @access  Private
 */
export const generateReport = asyncHandler(async (req: Request, res: Response) => {
  const { repoId } = req.params;

  const user = await User.findById(req.user._id);
  const repo = await Repository.findById(repoId) as IRepository;

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (!repo) {
    throw new ApiError(404, 'Repository not found');
  }

  // Check if user is connected to this repo
  if (!repo.users.includes(user._id)) {
    throw new ApiError(403, 'Not authorized to generate report for this repository');
  }

  // Calculate date range (last 7 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  // Create report
  const report = await Report.create({
    user: user._id,
    repository: repo._id,
    reportType: 'weekly',
    startDate,
    endDate,
    data: {
      commits: repo.metrics.commits.weekly.slice(-1)[0] || 0,
      pullRequests: {
        opened: repo.metrics.pullRequests.open,
        merged: repo.metrics.pullRequests.merged,
        closed: repo.metrics.pullRequests.closed,
      },
      issues: {
        opened: repo.metrics.issues.open,
        closed: repo.metrics.issues.closed,
      },
      contributors: repo.metrics.contributors,
      mergeTime: repo.metrics.mergeTime,
    },
    status: 'pending',
  });

  // Create email service instance
  const emailService = new EmailService();

  // Generate email HTML
  const emailHtml = emailService.generateReportEmail({
    username: user.username,
    repoName: repo.fullName,
    startDate: startDate.toLocaleDateString(),
    endDate: endDate.toLocaleDateString(),
    commits: report.data.commits,
    pullRequests: report.data.pullRequests,
    issues: report.data.issues,
    contributors: report.data.contributors,
    mergeTime: report.data.mergeTime,
    dashboardUrl: `${process.env.FRONTEND_URL}/dashboard/repo/${repo._id}`,
  });

  // Send email
  await emailService.sendEmail({
    to: user.email,
    subject: `DevInsight Weekly Report: ${repo.fullName}`,
    html: emailHtml,
  });

  // Update report status
  report.status = 'sent';
  report.sentAt = new Date();
  await report.save();

  res.status(200).json({
    message: 'Report generated and sent successfully',
    report,
  });
};

/**
 * @desc    Export report as CSV
 * @route   GET /api/report/:id/export
 * @access  Private
 */
export const exportReport = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { format = 'csv' } = req.query;

  const report = await Report.findById(id)
    .populate('repository')
    .populate('user', 'username email');

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  // Check if the report belongs to the user
  if (report.user._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized to export this report');
  }

  const filename = `${report.repository.fullName.replace('/', '-')}-report-${report.startDate.toISOString().split('T')[0]}`;

  if (format === 'pdf') {
    // Generate PDF report
    const pdfExporter = new PdfExporter();
    const pdfBuffer = await pdfExporter.generateReport(report, report.repository);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
    res.status(200).send(pdfBuffer);
  } else {
    // Generate CSV report
    const { generateReportCsv } = await import('../utils/csvExporter');
    const csvContent = await generateReportCsv(report, report.repository);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    res.status(200).send(csvContent);
  }
});