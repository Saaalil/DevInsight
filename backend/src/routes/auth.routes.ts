import express from 'express';
import {
  githubOAuth,
  githubCallback,
  getUserProfile,
  logoutUser,
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// Public routes
router.get('/github', githubOAuth);
router.get('/github/callback', githubCallback);

// Protected routes
router.get('/profile', protect, getUserProfile);
router.post('/logout', protect, logoutUser);

export default router;