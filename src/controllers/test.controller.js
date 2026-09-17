import testService from '../services/test.service.js';
import { HTTP_STATUS } from '../config/constants.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { paginatedResponse, successResponse } from '../utils/response.js';
import { badRequest } from '../utils/errors.js';

export const listTests = asyncHandler(async (req, res) => {
  const data = await testService.listTests(req.query, { user: req.user });
  return paginatedResponse(res, 'Tests fetched successfully', data.items, data);
});

export const getTest = asyncHandler(async (req, res) => {
  return successResponse(
    res,
    'Test fetched successfully',
    await testService.getTest(req.params.testId, { user: req.user, includeQuestions: true })
  );
});

export const startTest = asyncHandler(async (req, res) => {
  return successResponse(res, 'Test started', await testService.startTest(req.user.id, req.params.testId), HTTP_STATUS.CREATED);
});

export const getAttempt = asyncHandler(async (req, res) => {
  return successResponse(res, 'Attempt fetched successfully', await testService.getAttempt(req.user.id, req.params.attemptId));
});

export const saveAnswers = asyncHandler(async (req, res) => {
  const answers = Array.isArray(req.body.answers) ? req.body.answers : [req.body];
  return successResponse(res, 'Answers saved', await testService.saveAnswers(req.user.id, req.params.attemptId, answers));
});

export const submitAttempt = asyncHandler(async (req, res) => {
  const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
  return successResponse(res, 'Test submitted', await testService.submitAttempt(req.user.id, req.params.attemptId, answers));
});

export const getResult = asyncHandler(async (req, res) => {
  return successResponse(res, 'Result fetched successfully', await testService.getResult(req.user.id, req.params.attemptId));
});

export const adminListTests = asyncHandler(async (req, res) => {
  const data = await testService.listTests(req.query, { admin: true });
  return paginatedResponse(res, 'Tests fetched successfully', data.items, data);
});

export const adminGetTest = asyncHandler(async (req, res) => {
  return successResponse(res, 'Test fetched successfully', await testService.getTest(req.params.testId, { admin: true, includeQuestions: true }));
});

export const adminCreateTest = asyncHandler(async (req, res) => {
  return successResponse(res, 'Test created successfully', await testService.createTest(req.body), HTTP_STATUS.CREATED);
});

export const adminUpdateTest = asyncHandler(async (req, res) => {
  return successResponse(res, 'Test updated successfully', await testService.updateTest(req.params.testId, req.body));
});

export const adminDeleteTest = asyncHandler(async (req, res) => {
  return successResponse(res, 'Test deleted', await testService.deleteTest(req.params.testId));
});

export const adminAddQuestion = asyncHandler(async (req, res) => {
  return successResponse(res, 'Question added', await testService.addQuestion(req.params.testId, req.body), HTTP_STATUS.CREATED);
});

export const adminUpdateQuestion = asyncHandler(async (req, res) => {
  return successResponse(res, 'Question updated', await testService.updateQuestion(req.params.questionId, req.body));
});

export const adminDeleteQuestion = asyncHandler(async (req, res) => {
  return successResponse(res, 'Question deleted', await testService.deleteQuestion(req.params.questionId));
});

export const adminUploadQuestionImage = asyncHandler(async (req, res) => {
  if (!req.file) throw badRequest('Question image is required');
  return successResponse(res, 'Question image uploaded', await testService.uploadQuestionImage(req.file), HTTP_STATUS.CREATED);
});

export const adminListResults = asyncHandler(async (req, res) => {
  const data = await testService.listResults(req.query);
  return paginatedResponse(res, 'Results fetched successfully', data.items, data);
});

export const adminTestResults = asyncHandler(async (req, res) => {
  const data = await testService.listResults(req.query, { testId: req.params.testId });
  return paginatedResponse(res, 'Results fetched successfully', data.items, data);
});

export const adminGetResult = asyncHandler(async (req, res) => {
  return successResponse(res, 'Result fetched successfully', await testService.getResult(req.user.id, req.params.attemptId, { admin: true }));
});
