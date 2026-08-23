import multer from 'multer';
import { FILE_UPLOAD } from '../config/constants.js';
import { ERROR_CODES, HTTP_STATUS } from '../config/constants.js';

// Storage configuration using memory storage (files will be uploaded to Supabase)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = [...FILE_UPLOAD.ALLOWED_IMAGE_TYPES, ...FILE_UPLOAD.ALLOWED_DOCUMENT_TYPES];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

// Multer configuration
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: FILE_UPLOAD.MAX_SIZE
  },
  fileFilter: fileFilter
});

// Single file upload middleware
export const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    const uploadHandler = upload.single(fieldName);
    
    uploadHandler(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: `File size exceeds maximum limit of ${FILE_UPLOAD.MAX_SIZE / 1024 / 1024}MB`,
            code: ERROR_CODES.VALIDATION_ERROR
          });
        }
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: err.message,
          code: ERROR_CODES.VALIDATION_ERROR
        });
      } else if (err) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: err.message,
          code: ERROR_CODES.VALIDATION_ERROR
        });
      }
      
      next();
    });
  };
};

// Multiple files upload middleware
export const uploadMultiple = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    const uploadHandler = upload.array(fieldName, maxCount);
    
    uploadHandler(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: `File size exceeds maximum limit of ${FILE_UPLOAD.MAX_SIZE / 1024 / 1024}MB`,
            code: ERROR_CODES.VALIDATION_ERROR
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: `Maximum ${maxCount} files allowed`,
            code: ERROR_CODES.VALIDATION_ERROR
          });
        }
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: err.message,
          code: ERROR_CODES.VALIDATION_ERROR
        });
      } else if (err) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: err.message,
          code: ERROR_CODES.VALIDATION_ERROR
        });
      }
      
      next();
    });
  };
};

// Profile image upload
export const uploadProfileImage = uploadSingle('profileImage');

// Question image upload
export const uploadQuestionImage = uploadSingle('questionImage');

export const uploadExamPdf = uploadSingle('examPdf');
export const uploadContentFile = uploadSingle('file');
export const uploadImage = uploadSingle('image');
