import authService from '../services/auth.service.js';
import adminRepository from '../repositories/Admin.repository.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { HTTP_STATUS } from '../config/constants.js';

export const createAdmin = asyncHandler(async (req, res) => {
  const admin = await authService.registerAdmin(req.body);
  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Admin created successfully',
    data: admin
  });
});

export const getAdmin = asyncHandler(async (req, res) => {
  const admin = await adminRepository.findById(req.params.id);
  if (!admin) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Admin not found',
      data: null
    });
  }
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Admin retrieved successfully',
    data: admin.toJSON()
  });
});

export const listAdmins = asyncHandler(async (req, res) => {
  const filters = {
    search: req.query.search,
    isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
    roleId: req.query.roleId
  };
  const pagination = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20
  };

  const result = await adminRepository.findAll(filters, pagination);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Admins retrieved successfully',
    data: {
      admins: result.admins.map(admin => admin.toJSON()),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    }
  });
});

export const updateAdmin = asyncHandler(async (req, res) => {
  const admin = await adminRepository.update(req.params.id, req.body);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Admin updated successfully',
    data: admin.toJSON()
  });
});

export const deleteAdmin = asyncHandler(async (req, res) => {
  await adminRepository.delete(req.params.id);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Admin deleted successfully',
    data: null
  });
});

export const getProfile = asyncHandler(async (req, res) => {
  const admin = await adminRepository.findById(req.user.id);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Profile retrieved successfully',
    data: admin.toJSON()
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const admin = await adminRepository.update(req.user.id, req.body);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Profile updated successfully',
    data: admin.toJSON()
  });
});
