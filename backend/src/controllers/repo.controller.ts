import { Request, Response } from 'express';
import { ObjectId, Types } from 'mongoose';
import Repository, { IRepository } from '../models/repository.model';
import User from '../models/user.model';
import githubService from '../services/github.service';

/**
 * @desc    Get user's repositories
 * @route   GET /api/repo
 * @access  Private
 */
export const getUserRepos = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Get repositories from GitHub
    const githubRepos = await githubService.getUserRepos(user.accessToken);

    // Get user's connected repositories from database
    const connectedRepos = await Repository.find({ users: user._id });
    const connectedRepoNames = new Set(connectedRepos.map(repo => repo.fullName));

    // Map GitHub repos and mark connected ones
    const repos = githubRepos.map(repo => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      openIssues: repo.open_issues_count,
      watchers: repo.watchers_count,
      owner: repo.owner.login,
      isConnected: connectedRepoNames.has(repo.full_name),
    }));

    res.status(200).json(repos);
  } catch (error) {
    console.error('Get Repos Error:', error);
    res.status(500).json({ message: 'Failed to fetch repositories' });
  }
};

/**
 * @desc    Connect a repository
 * @route   POST /api/repo/connect
 * @access  Private
 */
import { ObjectId } from 'mongoose';
import Repository, { IRepository } from '../models/repository.model';

// Add a type guard for req.user
const getUserFromRequest = (req: Request): { _id: Types.ObjectId; accessToken: string } => {
  if (!req.user || typeof req.user !== 'object' || !('_id' in req.user) || !('accessToken' in req.user)) {
    throw new Error('Invalid user in request');
  }
  return req.user as { _id: Types.ObjectId; accessToken: string };
};

export const connectRepo = async (req: Request, res: Response): Promise<void> => {
  const { owner, name } = req.body;

  if (!owner || !name) {
    res.status(400).json({ message: 'Owner and name are required' });
    return;
  }

  try {
    const user = getUserFromRequest(req);

    const existingRepo = await Repository.findOne({ fullName: `${owner}/${name}` });

    if (existingRepo) {
      if (existingRepo.users.some((userId: Types.ObjectId) => userId.equals(user._id))) {
        res.status(400).json({ message: 'Repository already connected' });
        return;
      }

      existingRepo.users.push(user._id);
      await existingRepo.save();

      const userDoc = await User.findById(user._id);
      if (userDoc) {
        userDoc.connectedRepos.push(existingRepo._id);
        await userDoc.save();
      }

      res.status(200).json(existingRepo);
      return;
    }

    const githubRepo = await githubService.getRepo(user.accessToken, owner, name);

    const newRepo = await Repository.create({
      owner: githubRepo.owner.login,
      name: githubRepo.name,
      fullName: githubRepo.full_name,
      description: githubRepo.description,
      users: [user._id],
    });

    const userDoc = await User.findById(user._id);
    if (userDoc) {
      userDoc.connectedRepos.push(newRepo._id);
      await userDoc.save();
    }

    res.status(201).json(newRepo);
  } catch (error) {
    console.error('Connect Repo Error:', error);
    res.status(500).json({ message: 'Failed to connect repository' });
  }
};

/**
 * @desc    Disconnect a repository
 * @route   DELETE /api/repo/:id
 * @access  Private
 */
export const disconnectRepo = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Find repository
    const repo = await Repository.findById(id) as IRepository;

    if (!repo) {
      res.status(404).json({ message: 'Repository not found' });
      return;
    }

    // Check if user is connected to this repo
    if (!repo.users.includes(user._id)) {
      res.status(403).json({ message: 'Not authorized to disconnect this repository' });
      return;
    }

    // Remove user from repository
    repo.users = repo.users.filter(userId => !userId.equals(user._id));

    // Remove repo from user's connected repos
    user.connectedRepos = user.connectedRepos.filter(repoId => !repoId.equals(repo._id));

    // If no users are connected to the repo, delete it
    if (repo.users.length === 0) {
      await Repository.findByIdAndDelete(id);
    } else {
      await repo.save();
    }

    await user.save();

    res.status(200).json({ message: 'Repository disconnected successfully' });
  } catch (error) {
    console.error('Disconnect Repo Error:', error);
    res.status(500).json({ message: 'Failed to disconnect repository' });
  }
};

/**
 * @desc    Get repository details
 * @route   GET /api/repo/:id
 * @access  Private
 */
export const getRepoDetails = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Find repository
    const repo = await Repository.findById(id) as IRepository;

    if (!repo) {
      res.status(404).json({ message: 'Repository not found' });
      return;
    }

    // Check if user is connected to this repo
    if (!repo.users.includes(user._id)) {
      res.status(403).json({ message: 'Not authorized to view this repository' });
      return;
    }

    // Update metrics if last fetched more than 1 hour ago
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (repo.lastFetched < oneHourAgo) {
      await updateRepoMetrics(repo._id.toString(), user.accessToken);
    }

    res.status(200).json(repo);
  } catch (error) {
    console.error('Get Repo Details Error:', error);
    res.status(500).json({ message: 'Failed to fetch repository details' });
  }
};

/**
 * @desc    Get user's connected repositories
 * @route   GET /api/repo/connected
 * @access  Private
 */
export const getConnectedRepos = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user._id).populate('connectedRepos');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json(user.connectedRepos);
  } catch (error) {
    console.error('Get Connected Repos Error:', error);
    res.status(500).json({ message: 'Failed to fetch connected repositories' });
  }
};

/**
 * Helper function to update repository metrics
 * @param repoId Repository ID
 * @param accessToken GitHub access token
 */
async function updateRepoMetrics(repoId: string, accessToken: string): Promise<void> {
  try {
    const repo = await Repository.findById(repoId) as IRepository;

    if (!repo) {
      throw new Error('Repository not found');
    }

    // Get repository details from GitHub
    const githubRepo = await githubService.getRepo(accessToken, repo.owner, repo.name);

    // Update basic repository info
    repo.stars = githubRepo.stargazers_count;
    repo.forks = githubRepo.forks_count;
    repo.openIssues = githubRepo.open_issues_count;
    repo.watchers = githubRepo.watchers_count;

    // Get weekly commit activity
    const commitActivity = await githubService.getWeeklyCommitActivity(accessToken, repo.owner, repo.name);
    repo.metrics.commits.weekly = commitActivity.map(week => week.total);
    repo.metrics.commits.total = repo.metrics.commits.weekly.reduce((sum, count) => sum + count, 0);

    // Get pull requests
    const openPRs = await githubService.getRepoPullRequests(accessToken, repo.owner, repo.name, 'open');
    const closedPRs = await githubService.getRepoPullRequests(accessToken, repo.owner, repo.name, 'closed');
    
    repo.metrics.pullRequests.open = openPRs.length;
    repo.metrics.pullRequests.closed = closedPRs.filter(pr => !pr.merged_at).length;
    repo.metrics.pullRequests.merged = closedPRs.filter(pr => pr.merged_at).length;

    // Calculate average merge time for merged PRs
    const mergedPRs = closedPRs.filter(pr => pr.merged_at);
    if (mergedPRs.length > 0) {
      const totalMergeTime = mergedPRs.reduce((sum, pr) => {
        const createdAt = new Date(pr.created_at).getTime();
        const mergedAt = new Date(pr.merged_at as string).getTime();
        return sum + (mergedAt - createdAt) / (1000 * 60 * 60); // Convert to hours
      }, 0);
      repo.metrics.mergeTime = totalMergeTime / mergedPRs.length;
    }

    // Get issues
    const openIssues = await githubService.getRepoIssues(accessToken, repo.owner, repo.name, 'open');
    const closedIssues = await githubService.getRepoIssues(accessToken, repo.owner, repo.name, 'closed');
    
    repo.metrics.issues.open = openIssues.length;
    repo.metrics.issues.closed = closedIssues.length;

    // Get contributors
    const contributors = await githubService.getRepoContributors(accessToken, repo.owner, repo.name);
    repo.metrics.contributors = contributors.length;

    // Check for alerts
    // 1. No activity in the past 7 days
    const recentCommits = repo.metrics.commits.weekly.slice(-1)[0];
    repo.alerts.noActivity = recentCommits === 0;

    // 2. Long open PRs (more than 14 days)
    const longOpenPRs = openPRs.some(pr => {
      const createdAt = new Date(pr.created_at).getTime();
      const now = Date.now();
      const daysDiff = (now - createdAt) / (1000 * 60 * 60 * 24);
      return daysDiff > 14;
    });
    repo.alerts.longOpenPRs = longOpenPRs;

    // 3. Sudden drop in commits week over week
    if (repo.metrics.commits.weekly.length >= 2) {
      const currentWeek = repo.metrics.commits.weekly.slice(-1)[0];
      const previousWeek = repo.metrics.commits.weekly.slice(-2)[0];
      
      if (previousWeek > 0 && currentWeek === 0) {
        repo.alerts.commitDrops = true;
      } else if (previousWeek > 0 && currentWeek / previousWeek < 0.3) {
        // Drop of more than 70%
        repo.alerts.commitDrops = true;
      } else {
        repo.alerts.commitDrops = false;
      }
    }

    // Update last fetched timestamp
    repo.lastFetched = new Date();

    await repo.save();
  } catch (error) {
    console.error('Update Repo Metrics Error:', error);
    throw error;
  }
}