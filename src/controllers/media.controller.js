import mediaService from '../services/media.service.js';
import contentService from '../services/content.service.js';
import { BOOKMARK_TYPES, HTTP_STATUS } from '../config/constants.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { paginatedResponse, successResponse } from '../utils/response.js';
import { badRequest } from '../utils/errors.js';

export const listVideos = asyncHandler(async (req, res) => {
  const data = await mediaService.listVideos(req.query, { user: req.user });
  return paginatedResponse(res, 'Videos fetched successfully', data.items, data);
});

export const getVideo = asyncHandler(async (req, res) => {
  return successResponse(res, 'Video fetched successfully', await mediaService.getVideo(req.params.videoId, { user: req.user }));
});

export const viewVideo = asyncHandler(async (req, res) => {
  return successResponse(res, 'View recorded', await mediaService.viewVideo(req.params.videoId, req.user));
});

export const bookmarkVideo = asyncHandler(async (req, res) => {
  return successResponse(res, 'Bookmarked', await mediaService.addBookmark(req.user.id, BOOKMARK_TYPES.VIDEO, req.params.videoId), HTTP_STATUS.CREATED);
});

export const unbookmarkVideo = asyncHandler(async (req, res) => {
  return successResponse(res, 'Bookmark removed', await mediaService.removeBookmark(req.user.id, BOOKMARK_TYPES.VIDEO, req.params.videoId));
});

export const adminListVideos = asyncHandler(async (req, res) => {
  const data = await mediaService.listVideos(req.query, { admin: true });
  return paginatedResponse(res, 'Videos fetched successfully', data.items, data);
});

export const adminGetVideo = asyncHandler(async (req, res) => {
  return successResponse(res, 'Video fetched successfully', await mediaService.getVideo(req.params.videoId, { admin: true }));
});

export const adminCreateVideo = asyncHandler(async (req, res) => {
  return successResponse(res, 'Video created successfully', await mediaService.createVideo(req.body), HTTP_STATUS.CREATED);
});

export const adminUpdateVideo = asyncHandler(async (req, res) => {
  return successResponse(res, 'Video updated successfully', await mediaService.updateVideo(req.params.videoId, req.body));
});

export const adminDeleteVideo = asyncHandler(async (req, res) => {
  return successResponse(res, 'Video deleted', await mediaService.deleteVideo(req.params.videoId));
});

export const listCurrentAffairs = asyncHandler(async (req, res) => {
  const data = await mediaService.listCurrentAffairs(req.query);
  return paginatedResponse(res, 'Current affairs fetched successfully', data.items, data);
});

export const monthlyCurrentAffairs = asyncHandler(async (req, res) => {
  return successResponse(res, 'Monthly current affairs fetched successfully', await mediaService.monthlyCurrentAffairs(req.query));
});

export const getCurrentAffair = asyncHandler(async (req, res) => {
  return successResponse(res, 'Article fetched successfully', await mediaService.getCurrentAffair(req.params.articleId));
});

export const bookmarkCurrentAffair = asyncHandler(async (req, res) => {
  return successResponse(res, 'Bookmarked', await mediaService.addBookmark(req.user.id, BOOKMARK_TYPES.CURRENT_AFFAIR, req.params.articleId), HTTP_STATUS.CREATED);
});

export const unbookmarkCurrentAffair = asyncHandler(async (req, res) => {
  return successResponse(res, 'Bookmark removed', await mediaService.removeBookmark(req.user.id, BOOKMARK_TYPES.CURRENT_AFFAIR, req.params.articleId));
});

export const adminListCurrentAffairs = asyncHandler(async (req, res) => {
  const data = await mediaService.listCurrentAffairs(req.query, { admin: true });
  return paginatedResponse(res, 'Current affairs fetched successfully', data.items, data);
});

export const adminGetCurrentAffair = asyncHandler(async (req, res) => {
  return successResponse(res, 'Article fetched successfully', await mediaService.getCurrentAffair(req.params.articleId, { admin: true }));
});

export const adminCreateCurrentAffair = asyncHandler(async (req, res) => {
  return successResponse(res, 'Article created successfully', await mediaService.createCurrentAffair(req.body), HTTP_STATUS.CREATED);
});

export const adminUpdateCurrentAffair = asyncHandler(async (req, res) => {
  return successResponse(res, 'Article updated successfully', await mediaService.updateCurrentAffair(req.params.articleId, req.body));
});

export const adminDeleteCurrentAffair = asyncHandler(async (req, res) => {
  return successResponse(res, 'Article deleted', await mediaService.deleteCurrentAffair(req.params.articleId));
});

export const adminUploadCurrentAffair = asyncHandler(async (req, res) => {
  if (!req.file) throw badRequest('File is required');
  return successResponse(res, 'File uploaded successfully', await contentService.upload(req.file, 'current-affairs'), HTTP_STATUS.CREATED);
});
