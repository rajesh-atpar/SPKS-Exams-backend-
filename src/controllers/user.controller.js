import userService from '../services/user.service.js';
import progressService from '../services/progress.service.js';
import mediaService from '../services/media.service.js';
import testService from '../services/test.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { paginatedResponse, successResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';
import { badRequest } from '../utils/errors.js';

export const getMe = asyncHandler(async (req, res) => {
  return successResponse(res, 'Profile fetched successfully', await userService.getMe(req.user.id));
});

export const updateMe = asyncHandler(async (req, res) => {
  return successResponse(res, 'Profile updated successfully', await userService.updateMe(req.user.id, req.body));
});

export const uploadProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) throw badRequest('Profile image is required');
  return successResponse(res, 'Profile image updated', await userService.uploadProfileImage(req.user.id, req.file));
});

export const deleteProfileImage = asyncHandler(async (req, res) => {
  return successResponse(res, 'Profile image removed', await userService.deleteProfileImage(req.user.id));
});

export const getSettings = asyncHandler(async (req, res) => {
  return successResponse(res, 'Settings fetched successfully', await userService.getSettings(req.user.id));
});

export const updateSettings = asyncHandler(async (req, res) => {
  return successResponse(res, 'Settings updated successfully', await userService.updateSettings(req.user.id, req.body));
});

export const deleteAccount = asyncHandler(async (req, res) => {
  return successResponse(res, 'Account deleted', await userService.deleteAccount(req.user.id));
});

export const saveDeviceToken = asyncHandler(async (req, res) => {
  return successResponse(res, 'Device token saved', await userService.saveDeviceToken(req.user.id, req.body.token, req.body.platform));
});

export const removeDeviceToken = asyncHandler(async (req, res) => {
  return successResponse(res, 'Device token removed', await userService.removeDeviceToken(req.user.id, req.body.token));
});

export const myBookmarks = asyncHandler(async (req, res) => {
  const data = await mediaService.listBookmarks(req.user.id, req.query);
  return paginatedResponse(res, 'Bookmarks fetched successfully', data.items, data);
});

export const myProgress = asyncHandler(async (req, res) => {
  return successResponse(res, 'Progress fetched successfully', await progressService.getProgress(req.user.id));
});

export const myCourseProgress = asyncHandler(async (req, res) => {
  return successResponse(res, 'Course progress fetched successfully', await progressService.getCourseProgress(req.user.id));
});

export const myActivity = asyncHandler(async (req, res) => {
  return successResponse(res, 'Activity fetched successfully', await progressService.getActivity(req.user.id, req.query));
});

export const myStreak = asyncHandler(async (req, res) => {
  return successResponse(res, 'Streak fetched successfully', await progressService.getStreak(req.user.id));
});

export const myAnalytics = asyncHandler(async (req, res) => {
  return successResponse(res, 'Analytics fetched successfully', await progressService.getAnalytics(req.user.id));
});

export const myStats = asyncHandler(async (req, res) => {
  return successResponse(res, 'Stats fetched successfully', await progressService.getStats(req.user.id));
});

export const myAttempts = asyncHandler(async (req, res) => {
  const data = await testService.listMyAttempts(req.user.id, req.query);
  return paginatedResponse(res, 'Attempts fetched successfully', data.items, data);
});

export const myTestHistory = asyncHandler(async (req, res) => {
  const data = await testService.testHistory(req.user.id, req.query);
  return paginatedResponse(res, 'Test history fetched successfully', data.items, data);
});

export const adminListUsers = asyncHandler(async (req, res) => {
  const data = await userService.listUsers(req.query);
  return paginatedResponse(res, 'Users fetched successfully', data.items, data);
});

export const adminGetUser = asyncHandler(async (req, res) => {
  return successResponse(res, 'User fetched successfully', await userService.getUser(req.params.userId));
});

export const adminCreateUser = asyncHandler(async (req, res) => {
  return successResponse(res, 'User created successfully', await userService.createStaff(req.body), HTTP_STATUS.CREATED);
});

export const adminUpdateUser = asyncHandler(async (req, res) => {
  return successResponse(res, 'User updated successfully', await userService.updateUser(req.params.userId, req.body));
});

export const adminUpdateStatus = asyncHandler(async (req, res) => {
  return successResponse(res, 'User status updated', await userService.updateStatus(req.params.userId, req.body.status));
});

export const adminDeleteUser = asyncHandler(async (req, res) => {
  return successResponse(res, 'User deleted', await userService.deleteUser(req.params.userId));
});
