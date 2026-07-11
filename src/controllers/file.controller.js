import fileService from '../services/file.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const uploadProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
      data: null
    });
  }

  const result = await fileService.uploadProfileImage(req.file);
  res.status(200).json({
    success: true,
    message: 'Profile image uploaded successfully',
    data: result
  });
});

export const uploadQuestionImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
      data: null
    });
  }

  const result = await fileService.uploadQuestionImage(req.file);
  res.status(200).json({
    success: true,
    message: 'Question image uploaded successfully',
    data: result
  });
});

export const uploadExamPdf = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
      data: null
    });
  }

  const result = await fileService.uploadExamPdf(req.file);
  res.status(200).json({
    success: true,
    message: 'Exam PDF uploaded successfully',
    data: result
  });
});
