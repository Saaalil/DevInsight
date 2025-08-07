import { Request, Response } from 'express';
import Alert, { IAlert } from '../models/alert.model';
import Repository from '../models/repository.model';
import User from '../models/user.model';

/**
 * @desc    Get user's alerts
 * @route   GET /api/alert
 * @access  Private
 */
export const getUserAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const alerts = await Alert.find({ user: req.user._id, status: 'active' })
      .populate('repository', 'name fullName owner')
      .sort({ createdAt: -1 });

    res.status(200).json(alerts);
  } catch (error) {
    console.error('Get User Alerts Error:', error);
    res.status(500).json({ message: 'Failed to fetch alerts' });
  }
};

/**
 * @desc    Get alert by ID
 * @route   GET /api/alert/:id
 * @access  Private
 */
export const getAlertById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const alert = await Alert.findById(id)
      .populate('repository', 'name fullName owner')
      .populate('user', 'username email');

    if (!alert) {
      res.status(404).json({ message: 'Alert not found' });
      return;
    }

    // Check if the alert belongs to the user
    if (alert.user._id.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: 'Not authorized to view this alert' });
      return;
    }

    res.status(200).json(alert);
  } catch (error) {
    console.error('Get Alert Error:', error);
    res.status(500).json({ message: 'Failed to fetch alert' });
  }
};

/**
 * @desc    Update alert status
 * @route   PUT /api/alert/:id
 * @access  Private
 */
export const updateAlertStatus = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['active', 'resolved', 'dismissed'].includes(status)) {
    res.status(400).json({ message: 'Invalid status' });
    return;
  }

  try {
    const alert = await Alert.findById(id);

    if (!alert) {
      res.status(404).json({ message: 'Alert not found' });
      return;
    }

    // Check if the alert belongs to the user
    if (alert.user.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: 'Not authorized to update this alert' });
      return;
    }

    // Update alert status
    alert.status = status as 'active' | 'resolved' | 'dismissed';
    
    if (status === 'resolved' || status === 'dismissed') {
      alert.resolvedAt = new Date();
    }

    await alert.save();

    res.status(200).json(alert);
  } catch (error) {
    console.error('Update Alert Status Error:', error);
    res.status(500).json({ message: 'Failed to update alert status' });
  }
};

/**
 * @desc    Configure alert thresholds for a repository
 * @route   PUT /api/alert/config/:repoId
 * @access  Private
 */
export const configureAlertThresholds = async (req: Request, res: Response): Promise<void> => {
  const { repoId } = req.params;
  const { noActivityDays, longOpenPRsDays, commitDropPercentage } = req.body;

  try {
    const repo = await Repository.findById(repoId);

    if (!repo) {
      res.status(404).json({ message: 'Repository not found' });
      return;
    }

    // Check if user is connected to this repo
    if (!repo.users.includes(req.user._id)) {
      res.status(403).json({ message: 'Not authorized to configure alerts for this repository' });
      return;
    }

    // Create or update alert thresholds
    const thresholds = {
      noActivityDays: noActivityDays || 7,
      longOpenPRsDays: longOpenPRsDays || 14,
      commitDropPercentage: commitDropPercentage || 70,
    };

    // Store thresholds in user preferences or a separate collection
    // For now, we'll just return the thresholds
    res.status(200).json({
      message: 'Alert thresholds configured successfully',
      thresholds,
    });
  } catch (error) {
    console.error('Configure Alert Thresholds Error:', error);
    res.status(500).json({ message: 'Failed to configure alert thresholds' });
  }
};

/**
 * @desc    Create a new alert
 * @route   POST /api/alert
 * @access  Private
 */
export const createAlert = async (req: Request, res: Response): Promise<void> => {
  const { repositoryId, type, message, threshold, value } = req.body;

  if (!repositoryId || !type || !message || threshold === undefined || value === undefined) {
    res.status(400).json({ message: 'Missing required fields' });
    return;
  }

  try {
    const repo = await Repository.findById(repositoryId);

    if (!repo) {
      res.status(404).json({ message: 'Repository not found' });
      return;
    }

    // Check if user is connected to this repo
    if (!repo.users.includes(req.user._id)) {
      res.status(403).json({ message: 'Not authorized to create alerts for this repository' });
      return;
    }

    // Check if alert already exists
    const existingAlert = await Alert.findOne({
      user: req.user._id,
      repository: repositoryId,
      type,
      status: 'active',
    });

    if (existingAlert) {
      res.status(400).json({ message: 'Alert already exists' });
      return;
    }

    // Create new alert
    const alert = await Alert.create({
      user: req.user._id,
      repository: repositoryId,
      type,
      message,
      threshold,
      value,
      status: 'active',
    });

    res.status(201).json(alert);
  } catch (error) {
    console.error('Create Alert Error:', error);
    res.status(500).json({ message: 'Failed to create alert' });
  }
};