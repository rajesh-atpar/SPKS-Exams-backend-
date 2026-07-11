import examService from '../services/exam.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { HTTP_STATUS } from '../config/constants.js';

export const createExam = asyncHandler(async (req, res) => {
  const exam = await examService.createExam(req.body, req.user.id);
  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Exam created successfully',
    data: exam
  });
});

export const getExam = asyncHandler(async (req, res) => {
  const exam = await examService.getExam(req.params.id);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Exam retrieved successfully',
    data: exam
  });
});

export const listExams = asyncHandler(async (req, res) => {
  const filters = {
    search: req.query.search,
    isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
    isPublished: req.query.isPublished ? req.query.isPublished === 'true' : undefined,
    subjectId: req.query.subjectId
  };
  const pagination = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20
  };

  const result = await examService.listExams(filters, pagination);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Exams retrieved successfully',
    data: result
  });
});

export const updateExam = asyncHandler(async (req, res) => {
  const exam = await examService.updateExam(req.params.id, req.body);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Exam updated successfully',
    data: exam
  });
});

export const deleteExam = asyncHandler(async (req, res) => {
  await examService.deleteExam(req.params.id);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Exam deleted successfully',
    data: null
  });
});

export const assignExam = asyncHandler(async (req, res) => {
  await examService.assignExam(
    req.body.examId,
    req.body.studentIds,
    req.body.startDate,
    req.body.endDate
  );
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Exam assigned successfully',
    data: null
  });
});

export const startExam = asyncHandler(async (req, res) => {
  const result = await examService.startExam(
    req.params.examId,
    req.user.id,
    req.ip,
    req.headers['user-agent']
  );
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Exam started successfully',
    data: result
  });
});

export const submitAnswer = asyncHandler(async (req, res) => {
  await examService.submitAnswer(
    req.params.attemptId,
    req.body.questionId,
    req.body
  );
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Answer submitted successfully',
    data: null
  });
});

export const submitExam = asyncHandler(async (req, res) => {
  const result = await examService.submitExam(req.params.attemptId);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Exam submitted successfully',
    data: result
  });
});

export const getExamStatistics = asyncHandler(async (req, res) => {
  const stats = await examService.getExamStatistics(req.params.examId);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Exam statistics retrieved successfully',
    data: stats
  });
});
