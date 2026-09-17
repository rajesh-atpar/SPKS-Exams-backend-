import authService from '../services/auth.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { successResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';

export const register = asyncHandler(async (req, res) => {
  const data = await authService.register(req.body);
  return successResponse(res, 'Registration successful', data, HTTP_STATUS.CREATED);
});

export const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body.email, req.body.password, { appOnly: true });
  return successResponse(res, 'Login successful', data);
});

export const adminLogin = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body.email, req.body.password, { staffOnly: true });
  return successResponse(res, 'Login successful', data);
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.id, req.body.refreshToken);
  return successResponse(res, 'Logout successful');
});

export const refreshToken = asyncHandler(async (req, res) => {
  const data = await authService.refresh(req.body.refreshToken);
  return successResponse(res, 'Token refreshed successfully', data);
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const data = await authService.forgotPassword(req.body.email);
  return successResponse(res, data.message);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const data = await authService.resetPassword(req.body.token, req.body.password);
  return successResponse(res, data.message);
});

export const changePassword = asyncHandler(async (req, res) => {
  const data = await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
  return successResponse(res, data.message);
});

export const me = asyncHandler(async (req, res) => {
  const data = await authService.me(req.user.id);
  return successResponse(res, 'Profile fetched successfully', data);
});
