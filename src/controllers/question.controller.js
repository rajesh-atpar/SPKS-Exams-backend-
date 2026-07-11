import questionService from '../services/question.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { HTTP_STATUS } from '../config/constants.js';

export const createQuestion = asyncHandler(async (req, res) => {
  const question = await questionService.createQuestion(req.body, req.user.id);
  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Question created successfully',
    data: question
  });
});

export const getQuestion = asyncHandler(async (req, res) => {
  const question = await questionService.getQuestion(req.params.id);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Question retrieved successfully',
    data: question
  });
});

export const listQuestions = asyncHandler(async (req, res) => {
  const filters = {
    examId: req.query.examId,
    subjectId: req.query.subjectId,
    questionType: req.query.questionType,
    isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
    search: req.query.search
  };
  const pagination = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20
  };

  const result = await questionService.listQuestions(filters, pagination);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Questions retrieved successfully',
    data: result
  });
});

export const updateQuestion = asyncHandler(async (req, res) => {
  const question = await questionService.updateQuestion(req.params.id, req.body);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Question updated successfully',
    data: question
  });
});

export const deleteQuestion = asyncHandler(async (req, res) => {
  await questionService.deleteQuestion(req.params.id);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Question deleted successfully',
    data: null
  });
});

export const getExamQuestions = asyncHandler(async (req, res) => {
  const shuffle = req.query.shuffle === 'true';
  const questions = await questionService.getExamQuestions(req.params.examId, shuffle);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Exam questions retrieved successfully',
    data: questions
  });
});

export const batchCreateQuestions = asyncHandler(async (req, res) => {
  const questions = await questionService.batchCreateQuestions(req.body.questions, req.user.id);
  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Questions created successfully',
    data: questions
  });
});
