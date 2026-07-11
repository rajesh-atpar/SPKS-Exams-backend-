import subjectService from '../services/subject.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { HTTP_STATUS } from '../config/constants.js';

export const createSubject = asyncHandler(async (req, res) => {
  const subject = await subjectService.createSubject(req.body, req.user.id);
  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Subject created successfully',
    data: subject
  });
});

export const getSubject = asyncHandler(async (req, res) => {
  const subject = await subjectService.getSubject(req.params.id);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Subject retrieved successfully',
    data: subject
  });
});

export const listSubjects = asyncHandler(async (req, res) => {
  const filters = {
    search: req.query.search,
    isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
    category: req.query.category
  };
  const pagination = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20
  };

  const result = await subjectService.listSubjects(filters, pagination);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Subjects retrieved successfully',
    data: result
  });
});

export const updateSubject = asyncHandler(async (req, res) => {
  const subject = await subjectService.updateSubject(req.params.id, req.body);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Subject updated successfully',
    data: subject
  });
});

export const deleteSubject = asyncHandler(async (req, res) => {
  await subjectService.deleteSubject(req.params.id);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Subject deleted successfully',
    data: null
  });
});

export const getActiveSubjects = asyncHandler(async (req, res) => {
  const subjects = await subjectService.getActiveSubjects();
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Active subjects retrieved successfully',
    data: subjects
  });
});
