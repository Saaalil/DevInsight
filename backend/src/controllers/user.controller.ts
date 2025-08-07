import { Request, Response } from 'express';
import User from '../models/user.model';
import { clearTokens } from '../utils/generateToken';

/**
 * @desc    Get user profile
 * @route   GET /api/user/profile
 * @access  Private
 */
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user._id).select('-accessToken -refreshToken');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Get User Profile Error:', error);
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/user/profile
 * @access  Private
 */
export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Update user fields
    // Note: We don't allow updating username, email, or githubId as these come from GitHub
    // We could allow updating other preferences here

    await user.save();

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      emailReports: user.emailReports,
    });
  } catch (error) {
    console.error('Update User Profile Error:', error);
    res.status(500).json({ message: 'Failed to update user profile' });
  }
};

/**
 * @desc    Delete user account
 * @route   DELETE /api/user
 * @access  Private
 */
export const deleteUserAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Delete user
    await User.findByIdAndDelete(req.user._id);

    // Clear cookies
    clearTokens(res);

    res.status(200).json({ message: 'User account deleted successfully' });
  } catch (error) {
    console.error('Delete User Account Error:', error);
    res.status(500).json({ message: 'Failed to delete user account' });
  }
};