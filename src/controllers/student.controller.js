import studentService from '../services/student.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { HTTP_STATUS } from '../config/constants.js';

export const createStudent = asyncHandler(async (req, res) => {
  const student = await studentService.createStudent(req.body);
  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Student created successfully',
    data: student
  });
});

export const getStudent = asyncHandler(async (req, res) => {
  const student = await studentService.getStudent(req.params.id);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Student retrieved successfully',
    data: student
  });
});

export const listStudents = asyncHandler(async (req, res) => {
  const filters = {
    search: req.query.search,
    isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
    institution: req.query.institution,
    course: req.query.course,
    semester: req.query.semester
  };
  const pagination = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20
  };

  const result = await studentService.listStudents(filters, pagination);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Students retrieved successfully',
    data: result
  });
});

export const updateStudent = asyncHandler(async (req, res) => {
  const student = await studentService.updateStudent(req.params.id, req.body);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Student updated successfully',
    data: student
  });
});

export const deleteStudent = asyncHandler(async (req, res) => {
  await studentService.deleteStudent(req.params.id);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Student deleted successfully',
    data: null
  });
});

export const getStudentProfile = asyncHandler(async (req, res) => {
  const profile = await studentService.getProfile(req.user.id);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Profile retrieved successfully',
    data: profile
  });
});

export const updateStudentProfile = asyncHandler(async (req, res) => {
  const profile = await studentService.updateProfile(req.user.id, req.body);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Profile updated successfully',
    data: profile
  });
});

export const getAvailableExams = asyncHandler(async (req, res) => {
  const exams = await studentService.getAvailableExams(req.user.id);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Available exams retrieved successfully',
    data: exams
  });
});

export const getExamHistory = asyncHandler(async (req, res) => {
  const filters = {
    examId: req.query.examId,
    status: req.query.status
  };
  const pagination = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20
  };

  const result = await studentService.getExamHistory(req.user.id, filters, pagination);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Exam history retrieved successfully',
    data: result
  });
});

export const getStudentResults = asyncHandler(async (req, res) => {
  const filters = {
    examId: req.query.examId,
    isPassed: req.query.isPassed ? req.query.isPassed === 'true' : undefined
  };
  const pagination = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20
  };

  const result = await studentService.getResults(req.user.id, filters, pagination);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Results retrieved successfully',
    data: result
  });
});

export const getNotifications = asyncHandler(async (req, res) => {
  const filters = {
    isRead: req.query.isRead ? req.query.isRead === 'true' : undefined,
    type: req.query.type
  };
  const pagination = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20
  };

  const result = await studentService.getNotifications(req.user.id, filters, pagination);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Notifications retrieved successfully',
    data: result
  });
});

export const markNotificationAsRead = asyncHandler(async (req, res) => {
  await studentService.markNotificationAsRead(req.params.id, req.user.id);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Notification marked as read',
    data: null
  });
});

export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  await studentService.markAllNotificationsAsRead(req.user.id);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'All notifications marked as read',
    data: null
  });
});

export const getLeaderboard = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const leaderboard = await studentService.getLeaderboard(req.params.examId, limit);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Leaderboard retrieved successfully',
    data: leaderboard
  });
});
