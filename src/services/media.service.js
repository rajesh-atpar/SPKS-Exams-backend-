import { repos } from '../repositories/repos.js';
import { BOOKMARK_TYPES } from '../config/constants.js';
import { getPaginationParams } from '../utils/pagination.js';
import { conflict, notFound } from '../utils/errors.js';

export class MediaService {
  async listVideos(query, { admin = false } = {}) {
    const { page, limit } = getPaginationParams(query);
    const filters = admin ? {} : { isPublished: true };
    if (query.courseId) filters.courseId = query.courseId;
    if (query.category) filters.category = query.category;

    const { items, total } = await repos.videos.findMany({
      filters,
      page,
      limit,
      search: query.search,
      searchFields: ['title', 'description']
    });
    return { items, total, page, limit };
  }

  async getVideo(videoId, { admin = false } = {}) {
    const video = await repos.videos.findById(videoId);
    if (!video || (!admin && !video.isPublished)) throw notFound('Video');
    return video;
  }

  createVideo(payload) {
    return repos.videos.create({
      ...payload,
      publishedAt: payload.isPublished ? new Date().toISOString() : null
    });
  }

  async updateVideo(videoId, payload) {
    await this.getVideo(videoId, { admin: true });
    if (payload.isPublished === true) {
      payload.publishedAt = payload.publishedAt || new Date().toISOString();
    }
    return repos.videos.update(videoId, payload);
  }

  async deleteVideo(videoId) {
    await this.getVideo(videoId, { admin: true });
    await repos.videos.remove(videoId);
    return { message: 'Video deleted' };
  }

  async viewVideo(videoId) {
    const video = await this.getVideo(videoId);
    await repos.videos.increment(videoId, 'viewCount');
    return { videoId: video.id, viewed: true };
  }

  async listCurrentAffairs(query, { admin = false } = {}) {
    const { page, limit } = getPaginationParams(query);
    const filters = admin ? {} : { isPublished: true };
    if (query.category) filters.category = query.category;
    if (query.date) filters.date = query.date;
    if (query.state) filters.state = query.state;
    if (query.language) filters.language = query.language;

    const { items, total } = await repos.currentAffairs.findMany({
      filters,
      page,
      limit,
      search: query.search,
      searchFields: ['title', 'summary', 'description'],
      orderBy: 'date',
      order: 'desc'
    });
    return { items, total, page, limit };
  }

  async getCurrentAffair(articleId, { admin = false } = {}) {
    const article = await repos.currentAffairs.findById(articleId);
    if (!article || (!admin && !article.isPublished)) throw notFound('Article');
    return article;
  }

  createCurrentAffair(payload) {
    return repos.currentAffairs.create(payload);
  }

  async updateCurrentAffair(articleId, payload) {
    await this.getCurrentAffair(articleId, { admin: true });
    return repos.currentAffairs.update(articleId, payload);
  }

  async deleteCurrentAffair(articleId) {
    await this.getCurrentAffair(articleId, { admin: true });
    await repos.currentAffairs.remove(articleId);
    return { message: 'Article deleted' };
  }

  async monthlyCurrentAffairs(query) {
    const month = query.month || new Date().toISOString().slice(0, 7);
    const { items } = await this.listCurrentAffairs({ ...query, limit: 100 }, { admin: false });
    const grouped = items.filter((item) => String(item.date).startsWith(month));
    return {
      month,
      articles: grouped,
      count: grouped.length
    };
  }

  async listBookmarks(userId, query) {
    const { page, limit } = getPaginationParams(query);
    const filters = { userId };
    if (query.targetType) filters.targetType = query.targetType;
    const { items, total } = await repos.bookmarks.findMany({ filters, page, limit });

    const hydrated = await Promise.all(items.map(async (bookmark) => {
      let target = null;
      if (bookmark.targetType === BOOKMARK_TYPES.CONTENT) target = await repos.content.findById(bookmark.targetId);
      if (bookmark.targetType === BOOKMARK_TYPES.VIDEO) target = await repos.videos.findById(bookmark.targetId);
      if (bookmark.targetType === BOOKMARK_TYPES.CURRENT_AFFAIR) target = await repos.currentAffairs.findById(bookmark.targetId);
      return { ...bookmark, target };
    }));

    return { items: hydrated, total, page, limit };
  }

  async addBookmark(userId, targetType, targetId) {
    if (targetType === BOOKMARK_TYPES.CONTENT && !(await repos.content.findById(targetId))) {
      throw notFound('Content');
    }
    if (targetType === BOOKMARK_TYPES.VIDEO && !(await repos.videos.findById(targetId))) {
      throw notFound('Video');
    }
    if (targetType === BOOKMARK_TYPES.CURRENT_AFFAIR && !(await repos.currentAffairs.findById(targetId))) {
      throw notFound('Article');
    }

    const existing = await repos.bookmarks.findOne({ userId, targetType, targetId });
    if (existing) throw conflict('Already bookmarked');
    return repos.bookmarks.create({ userId, targetType, targetId });
  }

  async removeBookmark(userId, targetType, targetId) {
    const existing = await repos.bookmarks.findOne({ userId, targetType, targetId });
    if (!existing) throw notFound('Bookmark');
    await repos.bookmarks.remove(existing.id);
    return { message: 'Bookmark removed' };
  }
}

export default new MediaService();
