import { repos } from '../repositories/repos.js';
import { getPaginationParams } from '../utils/pagination.js';
import { notFound } from '../utils/errors.js';
import fileService from './file.service.js';
import accessService from './access.service.js';
import progressService from './progress.service.js';

const published = (admin) => (admin ? {} : { isPublished: true });

export class ContentService {
  async list(query, extraFilters = {}, { admin = false, user = null } = {}) {
    const { page, limit } = getPaginationParams(query);
    const { user: _user, ...safeFilters } = extraFilters;
    const filters = {
      ...published(admin),
      ...safeFilters
    };

    if (query.courseId) filters.courseId = query.courseId;
    if (query.groupId) filters.groupId = query.groupId;
    if (query.classId) filters.classId = query.classId;
    if (query.subjectId) filters.subjectId = query.subjectId;
    if (query.chapterId) filters.chapterId = query.chapterId;
    if (query.contentType) filters.contentType = query.contentType;
    if (query.language) filters.language = query.language;

    const { items, total } = await repos.content.findMany({
      filters,
      page,
      limit,
      search: query.search,
      searchFields: ['title', 'description']
    });

    return {
      items: admin ? items : await accessService.applyList(items, user),
      total,
      page,
      limit
    };
  }

  async get(contentId, { admin = false, user = null } = {}) {
    const item = await repos.content.findById(contentId);
    if (!item || (!admin && !item.isPublished)) throw notFound('Content');
    if (admin) return item;
    return accessService.applyItem(item, user);
  }

  create(payload) {
    return repos.content.create(payload);
  }

  async update(contentId, payload) {
    await this.get(contentId, { admin: true });
    return repos.content.update(contentId, payload);
  }

  async remove(contentId) {
    await this.get(contentId, { admin: true });
    await repos.content.remove(contentId);
    return { message: 'Content deleted' };
  }

  async upload(file, folder = 'content') {
    return fileService.uploadFile(file, folder);
  }

  async download(contentId, user) {
    const item = await repos.content.findById(contentId);
    if (!item || !item.isPublished) throw notFound('Content');
    await accessService.assertUnlocked(user, item, 'This file');
    if (user?.id) {
      await progressService.recordContentAccess(user.id, item);
    }
    await repos.content.increment(contentId, 'downloadCount');
    return { fileUrl: item.fileUrl, title: item.title };
  }

  async listChapters(subjectId, query, { admin = false } = {}) {
    const { page, limit } = getPaginationParams(query);
    const { items, total } = await repos.chapters.findMany({
      filters: { subjectId, ...(admin ? {} : { isPublished: true }) },
      page,
      limit,
      orderBy: 'display_order',
      order: 'asc',
      search: query.search,
      searchFields: ['title']
    });
    return { items, total, page, limit };
  }

  async getChapter(chapterId, { admin = false } = {}) {
    const chapter = await repos.chapters.findById(chapterId);
    if (!chapter || (!admin && !chapter.isPublished)) throw notFound('Chapter');
    return chapter;
  }

  createChapter(payload) {
    return repos.chapters.create(payload);
  }

  async updateChapter(chapterId, payload) {
    await this.getChapter(chapterId, { admin: true });
    return repos.chapters.update(chapterId, payload);
  }

  async deleteChapter(chapterId) {
    await this.getChapter(chapterId, { admin: true });
    await repos.chapters.remove(chapterId);
    return { message: 'Chapter deleted' };
  }

  async listLessons(chapterId, query, { admin = false } = {}) {
    if (chapterId) {
      await this.getChapter(chapterId, { admin });
    }
    const { page, limit } = getPaginationParams(query);
    const { items, total } = await repos.lessons.findMany({
      filters: { chapterId, ...(admin ? {} : { isPublished: true }) },
      page,
      limit,
      orderBy: 'display_order',
      order: 'asc'
    });
    return { items, total, page, limit };
  }

  async getLesson(lessonId, { admin = false } = {}) {
    const lesson = await repos.lessons.findById(lessonId);
    if (!lesson || (!admin && !lesson.isPublished)) throw notFound('Lesson');
    return lesson;
  }

  createLesson(payload) {
    return repos.lessons.create(payload);
  }

  async updateLesson(lessonId, payload) {
    await this.getLesson(lessonId, { admin: true });
    return repos.lessons.update(lessonId, payload);
  }

  async deleteLesson(lessonId) {
    await this.getLesson(lessonId, { admin: true });
    await repos.lessons.remove(lessonId);
    return { message: 'Lesson deleted' };
  }

  async completeLesson(userId, lessonId) {
    const lesson = await this.getLesson(lessonId);
    const existing = await repos.lessonCompletions.findOne({ userId, lessonId });
    if (!existing) {
      await repos.lessonCompletions.create({ userId, lessonId });
    }
    const context = await progressService.recordLessonAccess(userId, lesson, { completed: true });
    return { lessonId, completed: true, courseId: context.courseId || null };
  }

  async accessLesson(userId, lessonId) {
    const lesson = await this.getLesson(lessonId);
    const context = await progressService.recordLessonAccess(userId, lesson);
    return { lessonId, recorded: true, courseId: context.courseId || null };
  }
}

export default new ContentService();
