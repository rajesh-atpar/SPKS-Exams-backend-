import contentService from '../services/content.service.js';
import mediaService from '../services/media.service.js';
import { BOOKMARK_TYPES, HTTP_STATUS } from '../config/constants.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { paginatedResponse, successResponse } from '../utils/response.js';
import { badRequest } from '../utils/errors.js';

export const listContent = asyncHandler(async (req, res) => {
  const data = await contentService.list(req.query);
  return paginatedResponse(res, 'Content fetched successfully', data.items, data);
});

export const getContent = asyncHandler(async (req, res) => {
  return successResponse(res, 'Content fetched successfully', await contentService.get(req.params.contentId));
});

export const downloadContent = asyncHandler(async (req, res) => {
  return successResponse(res, 'Download ready', await contentService.download(req.params.contentId));
});

export const subjectContent = asyncHandler(async (req, res) => {
  const data = await contentService.list(req.query, { subjectId: req.params.subjectId });
  return paginatedResponse(res, 'Content fetched successfully', data.items, data);
});

export const chapterContent = asyncHandler(async (req, res) => {
  const data = await contentService.list(req.query, { chapterId: req.params.chapterId });
  return paginatedResponse(res, 'Content fetched successfully', data.items, data);
});

export const bookmarkContent = asyncHandler(async (req, res) => {
  return successResponse(res, 'Bookmarked', await mediaService.addBookmark(req.user.id, BOOKMARK_TYPES.CONTENT, req.params.contentId), HTTP_STATUS.CREATED);
});

export const unbookmarkContent = asyncHandler(async (req, res) => {
  return successResponse(res, 'Bookmark removed', await mediaService.removeBookmark(req.user.id, BOOKMARK_TYPES.CONTENT, req.params.contentId));
});

export const listChapters = asyncHandler(async (req, res) => {
  const data = await contentService.listChapters(req.params.subjectId, req.query);
  return paginatedResponse(res, 'Chapters fetched successfully', data.items, data);
});

export const getChapter = asyncHandler(async (req, res) => {
  return successResponse(res, 'Chapter fetched successfully', await contentService.getChapter(req.params.chapterId));
});

export const listLessons = asyncHandler(async (req, res) => {
  const data = await contentService.listLessons(req.params.chapterId, req.query);
  return paginatedResponse(res, 'Lessons fetched successfully', data.items, data);
});

export const getLesson = asyncHandler(async (req, res) => {
  return successResponse(res, 'Lesson fetched successfully', await contentService.getLesson(req.params.lessonId));
});

export const completeLesson = asyncHandler(async (req, res) => {
  return successResponse(res, 'Lesson completed', await contentService.completeLesson(req.user.id, req.params.lessonId));
});

export const adminListContent = asyncHandler(async (req, res) => {
  const data = await contentService.list(req.query, {}, { admin: true });
  return paginatedResponse(res, 'Content fetched successfully', data.items, data);
});

export const adminGetContent = asyncHandler(async (req, res) => {
  return successResponse(res, 'Content fetched successfully', await contentService.get(req.params.contentId, { admin: true }));
});

export const adminCreateContent = asyncHandler(async (req, res) => {
  return successResponse(res, 'Content created successfully', await contentService.create(req.body), HTTP_STATUS.CREATED);
});

export const adminUpdateContent = asyncHandler(async (req, res) => {
  return successResponse(res, 'Content updated successfully', await contentService.update(req.params.contentId, req.body));
});

export const adminDeleteContent = asyncHandler(async (req, res) => {
  return successResponse(res, 'Content deleted', await contentService.remove(req.params.contentId));
});

export const adminUploadContent = asyncHandler(async (req, res) => {
  if (!req.file) throw badRequest('File is required');
  return successResponse(res, 'File uploaded successfully', await contentService.upload(req.file), HTTP_STATUS.CREATED);
});

export const adminListChapters = asyncHandler(async (req, res) => {
  const data = await contentService.listChapters(req.query.subjectId, req.query, { admin: true });
  return paginatedResponse(res, 'Chapters fetched successfully', data.items, data);
});

export const adminGetChapter = asyncHandler(async (req, res) => {
  return successResponse(res, 'Chapter fetched successfully', await contentService.getChapter(req.params.chapterId, { admin: true }));
});

export const adminCreateChapter = asyncHandler(async (req, res) => {
  return successResponse(res, 'Chapter created successfully', await contentService.createChapter(req.body), HTTP_STATUS.CREATED);
});

export const adminUpdateChapter = asyncHandler(async (req, res) => {
  return successResponse(res, 'Chapter updated successfully', await contentService.updateChapter(req.params.chapterId, req.body));
});

export const adminDeleteChapter = asyncHandler(async (req, res) => {
  return successResponse(res, 'Chapter deleted', await contentService.deleteChapter(req.params.chapterId));
});

export const adminListLessons = asyncHandler(async (req, res) => {
  const data = await contentService.listLessons(req.query.chapterId, req.query, { admin: true });
  return paginatedResponse(res, 'Lessons fetched successfully', data.items, data);
});

export const adminGetLesson = asyncHandler(async (req, res) => {
  return successResponse(res, 'Lesson fetched successfully', await contentService.getLesson(req.params.lessonId, { admin: true }));
});

export const adminCreateLesson = asyncHandler(async (req, res) => {
  return successResponse(res, 'Lesson created successfully', await contentService.createLesson(req.body), HTTP_STATUS.CREATED);
});

export const adminUpdateLesson = asyncHandler(async (req, res) => {
  return successResponse(res, 'Lesson updated successfully', await contentService.updateLesson(req.params.lessonId, req.body));
});

export const adminDeleteLesson = asyncHandler(async (req, res) => {
  return successResponse(res, 'Lesson deleted', await contentService.deleteLesson(req.params.lessonId));
});
