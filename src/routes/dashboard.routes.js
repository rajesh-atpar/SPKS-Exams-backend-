import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getAdminDashboard,
  getStudentDashboard,
  getRecentActivity
} from '../controllers/dashboard.controller.js';

const router = Router();

// Protected routes
router.use(authenticate);

router.get(
  '/admin',
  authorize('admin'),
  getAdminDashboard
);

router.get(
  '/student',
  authorize('student'),
  getStudentDashboard
);

router.get(
  '/activity',
  authorize('admin'),
  getRecentActivity
);

export default router;
