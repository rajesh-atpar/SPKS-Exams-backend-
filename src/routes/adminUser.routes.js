import { Router } from 'express';
import { authenticate, authorizeAdmin, authorizeStaff } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { registerValidator } from '../validators/auth.validator.js';
import { statusValidator, uuidParam } from '../validators/common.validator.js';
import { userUpdateValidator } from '../validators/admin.validator.js';
import * as userController from '../controllers/user.controller.js';

const router = Router();

router.use(authenticate, authorizeStaff);

router.get('/', userController.adminListUsers);
router.post('/', authorizeAdmin, registerValidator, validate, userController.adminCreateUser);
router.get('/:userId/progress', uuidParam('userId'), validate, userController.adminUserProgress);
router.get('/:userId/continue-learning', uuidParam('userId'), validate, userController.adminUserContinueLearning);
router.get('/:userId/activity', uuidParam('userId'), validate, userController.adminUserActivity);
router.get('/:userId/course-progress', uuidParam('userId'), validate, userController.adminUserCourseProgress);
router.get('/:userId/test-history', uuidParam('userId'), validate, userController.adminUserTestHistory);
router.get('/:userId', uuidParam('userId'), validate, userController.adminGetUser);
router.patch('/:userId', uuidParam('userId'), userUpdateValidator, validate, userController.adminUpdateUser);
router.patch('/:userId/status', authorizeAdmin, uuidParam('userId'), statusValidator, validate, userController.adminUpdateStatus);
router.delete('/:userId', authorizeAdmin, uuidParam('userId'), validate, userController.adminDeleteUser);

export default router;
