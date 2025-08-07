import express from 'express';
import {
  getUserRepos,
  connectRepo,
  disconnectRepo,
  getRepoDetails,
  getConnectedRepos,
} from '../controllers/repo.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/', getUserRepos);
router.get('/connected', getConnectedRepos);
router.get('/:id', getRepoDetails);
router.post('/connect', connectRepo);
router.delete('/:id', disconnectRepo);

export default router;