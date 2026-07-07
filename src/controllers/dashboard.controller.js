import dashboardService from '../services/dashboard.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getAdminDashboard = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getAdminDashboard();
  res.status(200).json({
    success: true,
    message: 'Dashboard stats retrieved successfully',
    data: stats
  });
});

export const getStudentDashboard = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getStudentDashboard(req.user.id);
  res.status(200).json({
    success: true,
    message: 'Dashboard stats retrieved successfully',
    data: stats
  });
});

export const getRecentActivity = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const activity = await dashboardService.getRecentActivity(limit);
  res.status(200).json({
    success: true,
    message: 'Recent activity retrieved successfully',
    data: activity
  });
});
