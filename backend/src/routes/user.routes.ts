import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  deleteUserAccount
} from '../controllers/user.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.delete('/account', deleteUserAccount);

export default router;