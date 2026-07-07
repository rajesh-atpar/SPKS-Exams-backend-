import { Router } from 'express';
import { authenticate, authorize, checkPermission } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { authRateLimiter } from '../middleware/rateLimit.js';
import {
  createAdminValidator,
  updateAdminValidator,
  getAdminValidator,
  listAdminsValidator
} from '../validators/admin.validator.js';
import {
  createAdmin,
  getAdmin,
  listAdmins,
  updateAdmin,
  deleteAdmin,
  getProfile,
  updateProfile
} from '../controllers/admin.controller.js';

const router = Router();

// Public routes (none for admin - all require authentication)

// Protected routes - Admin only
router.use(authenticate);
router.use(authorize('admin'));

// Admin management (requires manage_students permission)
router.post(
  '/',
  checkPermission('manage_students'),
  authRateLimiter,
  createAdminValidator,
  validate,
  createAdmin
);

router.get(
  '/',
  checkPermission('manage_students'),
  listAdminsValidator,
  validate,
  listAdmins
);

router.get(
  '/profile',
  getProfile
);

router.put(
  '/profile',
  updateAdminValidator,
  validate,
  updateProfile
);

router.get(
  '/:id',
  checkPermission('manage_students'),
  getAdminValidator,
  validate,
  getAdmin
);

router.put(
  '/:id',
  checkPermission('manage_students'),
  updateAdminValidator,
  validate,
  updateAdmin
);

router.delete(
  '/:id',
  checkPermission('manage_students'),
  getAdminValidator,
  validate,
  deleteAdmin
);

export default router;
