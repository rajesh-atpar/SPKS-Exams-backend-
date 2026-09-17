import catalogService from '../services/catalog.service.js';
import contentService from '../services/content.service.js';
import mediaService from '../services/media.service.js';
import testService from '../services/test.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { paginatedResponse, successResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';

export const listCourses = asyncHandler(async (req, res) => {
  const data = await catalogService.listCourses(req.query, { publishedOnly: true });
  return paginatedResponse(res, 'Courses fetched successfully', data.items, data);
});

export const getCourse = asyncHandler(async (req, res) => {
  return successResponse(res, 'Course fetched successfully', await catalogService.getCourse(req.params.courseId, { publishedOnly: true }));
});

export const courseGroups = asyncHandler(async (req, res) => {
  const data = await catalogService.listGroups(req.query, { courseId: req.params.courseId, isActive: true });
  return paginatedResponse(res, 'Groups fetched successfully', data.items, data);
});

export const courseCategories = asyncHandler(async (req, res) => {
  return successResponse(res, 'Categories fetched successfully', await catalogService.courseCategories(req.params.courseId));
});

export const courseOverview = asyncHandler(async (req, res) => {
  return successResponse(res, 'Overview fetched successfully', await catalogService.courseOverview(req.params.courseId));
});

export const courseContent = asyncHandler(async (req, res) => {
  const data = await contentService.list(req.query, { courseId: req.params.courseId }, { user: req.user });
  return paginatedResponse(res, 'Content fetched successfully', data.items, data);
});

export const courseNotes = asyncHandler(async (req, res) => {
  const data = await contentService.list(req.query, { courseId: req.params.courseId, contentType: 'note' }, { user: req.user });
  return paginatedResponse(res, 'Notes fetched successfully', data.items, data);
});

export const courseBooks = asyncHandler(async (req, res) => {
  const data = await contentService.list(req.query, { courseId: req.params.courseId, contentType: 'book' }, { user: req.user });
  return paginatedResponse(res, 'Books fetched successfully', data.items, data);
});

export const courseOutsideSources = asyncHandler(async (req, res) => {
  const data = await contentService.list(req.query, { courseId: req.params.courseId, contentType: 'outside-source' }, { user: req.user });
  return paginatedResponse(res, 'Outside sources fetched successfully', data.items, data);
});

export const courseVideos = asyncHandler(async (req, res) => {
  const data = await mediaService.listVideos({ ...req.query, courseId: req.params.courseId }, { user: req.user });
  return paginatedResponse(res, 'Videos fetched successfully', data.items, data);
});

export const courseTests = asyncHandler(async (req, res) => {
  const data = await testService.listTests({ ...req.query, courseId: req.params.courseId, groupId: req.query.groupId }, { user: req.user });
  return paginatedResponse(res, 'Tests fetched successfully', data.items, data);
});

export const getGroup = asyncHandler(async (req, res) => {
  return successResponse(res, 'Group fetched successfully', await catalogService.getGroup(req.params.groupId));
});

export const groupSubjects = asyncHandler(async (req, res) => {
  const data = await catalogService.listSubjects(req.query, { groupId: req.params.groupId, isActive: true });
  return paginatedResponse(res, 'Subjects fetched successfully', data.items, data);
});

export const groupClasses = asyncHandler(async (req, res) => {
  const data = await catalogService.listClasses(req.query, { groupId: req.params.groupId, isActive: true });
  return paginatedResponse(res, 'Classes fetched successfully', data.items, data);
});

export const groupContent = asyncHandler(async (req, res) => {
  const data = await contentService.list(req.query, { groupId: req.params.groupId }, { user: req.user });
  return paginatedResponse(res, 'Content fetched successfully', data.items, data);
});

export const groupBooks = asyncHandler(async (req, res) => {
  const data = await contentService.list(req.query, { groupId: req.params.groupId, contentType: 'book' }, { user: req.user });
  return paginatedResponse(res, 'Books fetched successfully', data.items, data);
});

export const groupNotes = asyncHandler(async (req, res) => {
  const data = await contentService.list(req.query, { groupId: req.params.groupId, contentType: 'note' }, { user: req.user });
  return paginatedResponse(res, 'Notes fetched successfully', data.items, data);
});

export const groupOutsideSources = asyncHandler(async (req, res) => {
  const data = await contentService.list(req.query, { groupId: req.params.groupId, contentType: 'outside-source' }, { user: req.user });
  return paginatedResponse(res, 'Outside sources fetched successfully', data.items, data);
});

export const groupVideos = asyncHandler(async (req, res) => {
  const data = await mediaService.listVideos({ ...req.query, groupId: req.params.groupId }, { user: req.user });
  return paginatedResponse(res, 'Videos fetched successfully', data.items, data);
});

export const groupTests = asyncHandler(async (req, res) => {
  const data = await testService.listTests({ ...req.query, groupId: req.params.groupId }, { user: req.user });
  return paginatedResponse(res, 'Tests fetched successfully', data.items, data);
});

export const classSubjects = asyncHandler(async (req, res) => {
  const data = await catalogService.listSubjects(req.query, { classId: req.params.classId, isActive: true });
  return paginatedResponse(res, 'Subjects fetched successfully', data.items, data);
});

export const getSubject = asyncHandler(async (req, res) => {
  return successResponse(res, 'Subject fetched successfully', await catalogService.getSubject(req.params.subjectId));
});

export const adminListCourses = asyncHandler(async (req, res) => {
  const data = await catalogService.listCourses(req.query);
  return paginatedResponse(res, 'Courses fetched successfully', data.items, data);
});

export const adminGetCourse = asyncHandler(async (req, res) => {
  return successResponse(res, 'Course fetched successfully', await catalogService.getCourse(req.params.courseId));
});

export const adminCreateCourse = asyncHandler(async (req, res) => {
  return successResponse(res, 'Course created successfully', await catalogService.createCourse(req.body), HTTP_STATUS.CREATED);
});

export const adminUpdateCourse = asyncHandler(async (req, res) => {
  return successResponse(res, 'Course updated successfully', await catalogService.updateCourse(req.params.courseId, req.body));
});

export const adminDeleteCourse = asyncHandler(async (req, res) => {
  return successResponse(res, 'Course deleted', await catalogService.deleteCourse(req.params.courseId));
});

export const adminListGroups = asyncHandler(async (req, res) => {
  const data = await catalogService.listGroups(req.query, { courseId: req.query.courseId });
  return paginatedResponse(res, 'Groups fetched successfully', data.items, data);
});

export const adminGetGroup = asyncHandler(async (req, res) => {
  return successResponse(res, 'Group fetched successfully', await catalogService.getGroup(req.params.groupId));
});

export const adminCreateGroup = asyncHandler(async (req, res) => {
  return successResponse(res, 'Group created successfully', await catalogService.createGroup(req.body), HTTP_STATUS.CREATED);
});

export const adminUpdateGroup = asyncHandler(async (req, res) => {
  return successResponse(res, 'Group updated successfully', await catalogService.updateGroup(req.params.groupId, req.body));
});

export const adminDeleteGroup = asyncHandler(async (req, res) => {
  return successResponse(res, 'Group deleted', await catalogService.deleteGroup(req.params.groupId));
});

export const adminListClasses = asyncHandler(async (req, res) => {
  const data = await catalogService.listClasses(req.query, { groupId: req.query.groupId });
  return paginatedResponse(res, 'Classes fetched successfully', data.items, data);
});

export const adminGetClass = asyncHandler(async (req, res) => {
  return successResponse(res, 'Class fetched successfully', await catalogService.getClass(req.params.classId));
});

export const adminCreateClass = asyncHandler(async (req, res) => {
  return successResponse(res, 'Class created successfully', await catalogService.createClass(req.body), HTTP_STATUS.CREATED);
});

export const adminUpdateClass = asyncHandler(async (req, res) => {
  return successResponse(res, 'Class updated successfully', await catalogService.updateClass(req.params.classId, req.body));
});

export const adminDeleteClass = asyncHandler(async (req, res) => {
  return successResponse(res, 'Class deleted', await catalogService.deleteClass(req.params.classId));
});

export const adminListSubjects = asyncHandler(async (req, res) => {
  const data = await catalogService.listSubjects(req.query, {
    courseId: req.query.courseId,
    groupId: req.query.groupId,
    classId: req.query.classId
  });
  return paginatedResponse(res, 'Subjects fetched successfully', data.items, data);
});

export const adminGetSubject = asyncHandler(async (req, res) => {
  return successResponse(res, 'Subject fetched successfully', await catalogService.getSubject(req.params.subjectId));
});

export const adminCreateSubject = asyncHandler(async (req, res) => {
  return successResponse(res, 'Subject created successfully', await catalogService.createSubject(req.body), HTTP_STATUS.CREATED);
});

export const adminUpdateSubject = asyncHandler(async (req, res) => {
  return successResponse(res, 'Subject updated successfully', await catalogService.updateSubject(req.params.subjectId, req.body));
});

export const adminDeleteSubject = asyncHandler(async (req, res) => {
  return successResponse(res, 'Subject deleted', await catalogService.deleteSubject(req.params.subjectId));
});
