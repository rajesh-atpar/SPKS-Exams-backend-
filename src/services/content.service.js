import { repos } from '../repositories/repos.js';
import { FILE_UPLOAD } from '../config/constants.js';
import { getPaginationParams } from '../utils/pagination.js';
import { notFound } from '../utils/errors.js';
import fileService from './file.service.js';
import accessService from './access.service.js';
import progressService from './progress.service.js';

const published = (admin) => (admin ? {} : { isPublished: true });

const apiPath = (path) => {
  const base = String(process.env.API_BASE_URL || '').replace(/\/+$/, '');
  return base ? `${base}${path}` : path;
};

const emptyToNull = (value) => (value === '' ? null : value);

export class ContentService {
  withContentView(item) {
    if (!item) return item;
    return {
      ...item,
      viewUrl: item.fileUrl ? apiPath(`/api/content/${item.id}/view`) : null
    };
  }

  presentLesson(lesson, { admin = false } = {}) {
    if (!lesson) return lesson;
    const { pdfPath, ...rest } = lesson;
    const hasPdf = Boolean(lesson.pdfUrl || pdfPath);
    return {
      ...rest,
      pdfUrl: lesson.pdfUrl || null,
      pdfViewUrl: hasPdf ? apiPath(`/api/lessons/${lesson.id}/pdf`) : null,
      ...(admin ? { pdfPath: pdfPath || null } : {})
    };
  }

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

    const visible = admin ? items : await accessService.applyList(items, user);
    return {
      items: visible.map((item) => this.withContentView(item)),
      total,
      page,
      limit
    };
  }

  async get(contentId, { admin = false, user = null } = {}) {
    const item = await repos.content.findById(contentId);
    if (!item || (!admin && !item.isPublished)) throw notFound('Content');
    const visible = admin ? item : await accessService.applyItem(item, user);
    return this.withContentView(visible);
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

  async viewContent(contentId, user, res) {
    const item = await repos.content.findById(contentId);
    if (!item || !item.isPublished) throw notFound('Content');
    await accessService.assertUnlocked(user, item, 'This file');
    if (!item.fileUrl) throw notFound('PDF');
    if (user?.id) {
      await progressService.recordContentAccess(user.id, item);
    }
    await fileService.streamPdf(res, {
      fileUrl: item.fileUrl,
      filePath: fileService.extractUploadsPath(item.fileUrl),
      filename: `${item.title || 'document'}.pdf`
    });
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
    return {
      items: items.map((lesson) => this.presentLesson(lesson, { admin })),
      total,
      page,
      limit
    };
  }

  async getLesson(lessonId, { admin = false } = {}) {
    const lesson = await repos.lessons.findById(lessonId);
    if (!lesson || (!admin && !lesson.isPublished)) throw notFound('Lesson');
    return this.presentLesson(lesson, { admin });
  }

  async createLesson(payload) {
    return this.presentLesson(await repos.lessons.create(payload), { admin: true });
  }

  async updateLesson(lessonId, payload) {
    await this.getLesson(lessonId, { admin: true });
    const next = { ...payload };
    if (Object.prototype.hasOwnProperty.call(next, 'pdfUrl')) next.pdfUrl = emptyToNull(next.pdfUrl);
    if (Object.prototype.hasOwnProperty.call(next, 'pdfPath')) next.pdfPath = emptyToNull(next.pdfPath);
    return this.presentLesson(await repos.lessons.update(lessonId, next), { admin: true });
  }

  async deleteLesson(lessonId) {
    const lesson = await this.getLesson(lessonId, { admin: true });
    await repos.lessons.remove(lessonId);
    await fileService.deleteQuietly(lesson.pdfPath);
    return { message: 'Lesson deleted' };
  }

  async uploadLessonPdf(file) {
    return fileService.uploadFile(file, FILE_UPLOAD.LESSON_PDF_PATH);
  }

  async replaceLessonPdf(lessonId, file) {
    const lesson = await this.getLesson(lessonId, { admin: true });
    const uploaded = await this.uploadLessonPdf(file);
    const updated = await repos.lessons.update(lessonId, {
      pdfUrl: uploaded.url,
      pdfPath: uploaded.path
    });
    if (lesson.pdfPath && lesson.pdfPath !== uploaded.path) {
      await fileService.deleteQuietly(lesson.pdfPath);
    }
    return this.presentLesson(updated, { admin: true });
  }

  async viewLessonPdf(lessonId, res) {
    const lesson = await repos.lessons.findById(lessonId);
    if (!lesson || !lesson.isPublished) throw notFound('Lesson');
    if (!lesson.pdfUrl && !lesson.pdfPath) throw notFound('Lesson PDF');
    await fileService.streamPdf(res, {
      filePath: lesson.pdfPath,
      fileUrl: lesson.pdfUrl,
      filename: `${lesson.title || 'lesson'}.pdf`
    });
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
