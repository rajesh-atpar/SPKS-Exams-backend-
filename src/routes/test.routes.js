import { Router } from 'express';
import { authenticate, authorizeAppUser } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { uuidParam } from '../validators/common.validator.js';
import * as testController from '../controllers/test.controller.js';

export const testRoutes = Router();
testRoutes.use(authenticate, authorizeAppUser);
testRoutes.get('/', testController.listTests);
testRoutes.get('/:testId', uuidParam('testId'), validate, testController.getTest);
testRoutes.post('/:testId/start', uuidParam('testId'), validate, testController.startTest);

export const attemptRoutes = Router();
attemptRoutes.use(authenticate, authorizeAppUser);
attemptRoutes.get('/:attemptId', uuidParam('attemptId'), validate, testController.getAttempt);
attemptRoutes.post('/:attemptId/answers', uuidParam('attemptId'), validate, testController.saveAnswers);
attemptRoutes.post('/:attemptId/submit', uuidParam('attemptId'), validate, testController.submitAttempt);
attemptRoutes.get('/:attemptId/result', uuidParam('attemptId'), validate, testController.getResult);
