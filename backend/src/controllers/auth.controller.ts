import { Request, Response } from 'express';
import axios, { AxiosError } from 'axios';
import mongoose from 'mongoose';
import crypto from 'crypto';
import User, { IUser } from '../models/user.model';
import githubService from '../services/github.service';
import { generateToken, generateRefreshToken, clearTokens } from '../utils/generateToken';
import { ApiError } from '../middleware/error.middleware';

// Extend Express Request to include session
declare module 'express-serve-static-core' {
  interface Request {
    session: {
      oauthState?: string;
      [key: string]: any;
    };
    user?: IUser;
  }
}

interface GitHubOAuthError {
  message: string;
  documentation_url: string;
}

/**
 * @desc    Redirect to GitHub OAuth
 * @route   GET /api/auth/github
 * @access  Public
 */
export const githubOAuth = (req: Request, res: Response): void => {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = process.env.GITHUB_CALLBACK_URL;
    
    if (!clientId || !redirectUri) {
      throw new ApiError(500, 'GitHub OAuth configuration is missing');
    }

    // Required scopes for the application
    const scope = 'repo read:user user:email';
    
    // Generate and store state parameter to prevent CSRF
    const state = crypto.randomBytes(16).toString('hex');
    req.session.oauthState = state;
    
    const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
    githubAuthUrl.searchParams.append('client_id', clientId);
    githubAuthUrl.searchParams.append('redirect_uri', redirectUri);
    githubAuthUrl.searchParams.append('scope', scope);
    githubAuthUrl.searchParams.append('state', state);
    
    // Set security headers
    res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    res.redirect(githubAuthUrl.toString());
  } catch (error) {
    console.error('GitHub OAuth Error:', error);
    res.status(500).json({ message: 'Failed to initiate GitHub authentication' });
  }
};

/**
 * @desc    GitHub OAuth callback
 * @route   GET /api/auth/github/callback
 * @access  Public
 */
export const githubCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    // Type assertion for query parameters
    const code = req.query.code as string | undefined;
    const state = req.query.state as string | undefined;
    const storedState = req.session?.oauthState;

    // Validate required parameters
    if (!code || typeof code !== 'string') {
      throw new ApiError(400, 'Authorization code is required');
    }

    // Validate state parameter to prevent CSRF
    if (!state || !storedState || state !== storedState) {
      throw new ApiError(400, 'Invalid state parameter');
    }

    // Clear the stored state
    if (req.session) {
      delete req.session.oauthState;
    }

    // Validate environment variables
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const redirectUri = process.env.GITHUB_CALLBACK_URL;
    const frontendUrl = process.env.FRONTEND_URL;

    if (!clientId || !clientSecret || !redirectUri || !frontendUrl) {
      throw new ApiError(500, 'OAuth configuration is incomplete');
    }

    // Exchange code for access token with error handling
    let tokenResponse;
    try {
      tokenResponse = await axios.post<{ access_token?: string; error?: string }>(
        'https://github.com/login/oauth/access_token',
        {
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
        },
        {
          headers: {
            Accept: 'application/json',
          },
          timeout: 5000, // 5 second timeout
        }
      );
    } catch (error) {
      const axiosError = error as AxiosError<GitHubOAuthError>;
      console.error('GitHub Token Exchange Error:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
      });
      throw new ApiError(500, 'Failed to exchange GitHub code for access token');
    }

    const { access_token, error } = tokenResponse.data;

    if (error || !access_token) {
      throw new ApiError(400, `Failed to obtain access token: ${error || 'No token received'}`);
    }

    // Get user info from GitHub
    let githubUser;
    try {
      githubUser = await githubService.getUser(access_token);
    } catch (error) {
      console.error('GitHub User Info Error:', error);
      throw new ApiError(500, 'Failed to fetch GitHub user information');
    }

    // Database operations with transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Check if user exists in database
      let user = await User.findOne({ githubId: githubUser.id.toString() }).session(session);

      if (user) {
        // Update existing user
        user.accessToken = access_token;
        user.username = githubUser.login;
        user.avatarUrl = githubUser.avatar_url;
        user.email = githubUser.email;
        await user.save({ session });
      } else {
        // Create new user
        const newUser = await User.create({
          githubId: githubUser.id.toString(),
          username: githubUser.login,
          email: githubUser.email,
          avatarUrl: githubUser.avatar_url,
          accessToken: access_token,
          emailReports: {
            enabled: false,
            frequency: 'weekly',
          },
        });
        user = await User.findById(newUser._id).session(session);
      }

      if (!user) {
        throw new ApiError(500, 'Failed to create or retrieve user');
      }

      // Generate tokens
      generateToken(res, user._id as mongoose.Types.ObjectId);
      generateRefreshToken(res, user._id as mongoose.Types.ObjectId);

      await session.commitTransaction();

      // Set security headers
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      
      // Redirect to frontend
      res.redirect(`${frontendUrl}/dashboard`);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('GitHub OAuth Error:', error instanceof Error ? error.stack : error);
    
    // Handle known errors
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    // Handle unknown errors
    res.status(500).json({ 
      message: 'Authentication failed',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?._id) {
      throw new ApiError(401, 'Authentication required');
    }

    const user = await User.findById(req.user._id)
      .select('-accessToken -refreshToken')
      .lean();

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.status(200).json(user);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    
    console.error('Get Profile Error:', error instanceof Error ? error.stack : error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logoutUser = (req: Request, res: Response): void => {
  clearTokens(res);
  res.status(200).json({ message: 'Logged out successfully' });
};