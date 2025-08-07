import express from 'express';
import {
  getReportSettings,
  updateReportSettings,
  getUserReports,
  getReportById,
  generateReport,
  exportReportCsv
} from '../controllers/report.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/settings', getReportSettings);
router.put('/settings', updateReportSettings);
router.get('/', getUserReports);
router.get('/:id', getReportById);
router.post('/generate/:repoId', generateReport);
router.get('/:id/export', exportReport);

export default router;