import express from 'express';
import {
  getUserAlerts,
  getAlertById,
  updateAlertStatus,
  configureAlertThresholds
} from '../controllers/alert.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/', getUserAlerts);
router.get('/:id', getAlertById);
router.put('/:id/status', updateAlertStatus);
router.post('/configure/:repoId', configureAlertThresholds);

export default router;