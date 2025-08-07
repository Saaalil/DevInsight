import axios from 'axios';

interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  email: string;
  name: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
  default_branch: string;
  owner: {
    login: string;
  };
}

interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  author: {
    login: string;
    avatar_url: string;
  };
}

interface GitHubPullRequest {
  id: number;
  number: number;
  state: string;
  title: string;
  user: {
    login: string;
  };
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
}

interface GitHubIssue {
  id: number;
  number: number;
  state: string;
  title: string;
  user: {
    login: string;
  };
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

interface GitHubContributor {
  login: string;
  id: number;
  avatar_url: string;
  contributions: number;
}

class GitHubService {
  private baseUrl = 'https://api.github.com';

  /**
   * Get user information from GitHub API
   * @param accessToken GitHub access token
   * @returns GitHub user information
   */
  async getUser(accessToken: string): Promise<GitHubUser> {
    try {
      const response = await axios.get(`${this.baseUrl}/user`, {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`GitHub API Error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get user's repositories from GitHub API
   * @param accessToken GitHub access token
   * @returns List of GitHub repositories
   */
  async getUserRepos(accessToken: string): Promise<GitHubRepo[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/user/repos`, {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
        params: {
          sort: 'updated',
          per_page: 100,
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`GitHub API Error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get repository information from GitHub API
   * @param accessToken GitHub access token
   * @param owner Repository owner
   * @param repo Repository name
   * @returns GitHub repository information
   */
  async getRepo(accessToken: string, owner: string, repo: string): Promise<GitHubRepo> {
    try {
      const response = await axios.get(`${this.baseUrl}/repos/${owner}/${repo}`, {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`GitHub API Error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get repository commits from GitHub API
   * @param accessToken GitHub access token
   * @param owner Repository owner
   * @param repo Repository name
   * @param since Optional date to filter commits since
   * @returns List of GitHub commits
   */
  async getRepoCommits(
    accessToken: string,
    owner: string,
    repo: string,
    since?: string
  ): Promise<GitHubCommit[]> {
    try {
      const params: Record<string, string> = {
        per_page: '100',
      };

      if (since) {
        params.since = since;
      }

      const response = await axios.get(`${this.baseUrl}/repos/${owner}/${repo}/commits`, {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
        params,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`GitHub API Error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get repository pull requests from GitHub API
   * @param accessToken GitHub access token
   * @param owner Repository owner
   * @param repo Repository name
   * @param state Pull request state (open, closed, all)
   * @returns List of GitHub pull requests
   */
  async getRepoPullRequests(
    accessToken: string,
    owner: string,
    repo: string,
    state: 'open' | 'closed' | 'all' = 'all'
  ): Promise<GitHubPullRequest[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/repos/${owner}/${repo}/pulls`, {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
        params: {
          state,
          per_page: 100,
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`GitHub API Error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get repository issues from GitHub API
   * @param accessToken GitHub access token
   * @param owner Repository owner
   * @param repo Repository name
   * @param state Issue state (open, closed, all)
   * @returns List of GitHub issues
   */
  async getRepoIssues(
    accessToken: string,
    owner: string,
    repo: string,
    state: 'open' | 'closed' | 'all' = 'all'
  ): Promise<GitHubIssue[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/repos/${owner}/${repo}/issues`, {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
        params: {
          state,
          per_page: 100,
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`GitHub API Error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get repository contributors from GitHub API
   * @param accessToken GitHub access token
   * @param owner Repository owner
   * @param repo Repository name
   * @returns List of GitHub contributors
   */
  async getRepoContributors(
    accessToken: string,
    owner: string,
    repo: string
  ): Promise<GitHubContributor[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/repos/${owner}/${repo}/contributors`, {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
        params: {
          per_page: 100,
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`GitHub API Error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get weekly commit count for the past year
   * @param accessToken GitHub access token
   * @param owner Repository owner
   * @param repo Repository name
   * @returns Weekly commit counts
   */
  async getWeeklyCommitActivity(
    accessToken: string,
    owner: string,
    repo: string
  ): Promise<{ week: number; total: number; days: number[] }[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/repos/${owner}/${repo}/stats/commit_activity`, {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`GitHub API Error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }
}

export default new GitHubService();