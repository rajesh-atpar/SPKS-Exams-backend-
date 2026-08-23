import { repos } from '../repositories/repos.js';
import { DEFAULT_COURSES } from '../repositories/live.repository.js';
import { getPaginationParams } from '../utils/pagination.js';
import { slugify } from '../utils/string.js';
import { notFound } from '../utils/errors.js';

const list = (repo, query, filters = {}, searchFields = ['name']) => {
  const { page, limit } = getPaginationParams(query);
  return repo.findMany({
    filters,
    page,
    limit,
    search: query.search,
    searchFields,
    orderBy: query.sortBy === 'name' ? 'name' : 'display_order',
    order: query.sortOrder || 'asc'
  }).then(({ items, total }) => ({ items, total, page, limit }));
};

const requireRow = async (repo, id, name) => {
  const row = await repo.findById(id);
  if (!row) throw notFound(name);
  return row;
};

export class CatalogService {
  async listCourses(query, { publishedOnly = false } = {}) {
    const result = await list(repos.courses, query, {});
    const source = result.items.length ? result.items : DEFAULT_COURSES;
    const items = publishedOnly ? source.filter((course) => course.isActive !== false) : source;
    return { ...result, items, total: items.length };
  }

  async getCourse(courseId, { publishedOnly = false } = {}) {
    let course = null;
    try {
      course = await repos.courses.findById(courseId);
    } catch {
      course = null;
    }
    if (!course) {
      try {
        course = await repos.courses.findOne({ slug: courseId });
      } catch {
        course = null;
      }
    }
    if (!course) {
      course = DEFAULT_COURSES.find((item) => item.id === courseId || item.slug === courseId) || null;
    }
    if (!course) throw notFound('Course');
    if (publishedOnly && course.isActive === false) throw notFound('Course');
    return course;
  }

  async createCourse(payload) {
    return repos.courses.create({
      ...payload,
      slug: payload.slug || slugify(payload.name)
    });
  }

  async updateCourse(courseId, payload) {
    await requireRow(repos.courses, courseId, 'Course');
    return repos.courses.update(courseId, payload);
  }

  async deleteCourse(courseId) {
    await requireRow(repos.courses, courseId, 'Course');
    await repos.courses.remove(courseId);
    return { message: 'Course deleted' };
  }

  async courseOverview(courseId) {
    const course = await this.getCourse(courseId, { publishedOnly: true });
    const safeCount = async (fn) => {
      try {
        return await fn();
      } catch {
        return { items: [], total: 0 };
      }
    };

    const [groups, subjects, content, videos, tests] = await Promise.all([
      safeCount(() => repos.groups.findMany({ filters: { courseId }, limit: 1 })),
      safeCount(() => repos.subjects.findMany({ filters: { courseId }, limit: 1 })),
      safeCount(() => repos.content.findMany({ filters: { courseId }, limit: 1 })),
      safeCount(() => repos.videos.findMany({ filters: { courseId }, limit: 1 })),
      safeCount(() => repos.tests.findMany({ filters: { courseId }, limit: 1 }))
    ]);

    return {
      course,
      counts: {
        groups: groups.total,
        subjects: subjects.total,
        content: content.total,
        videos: videos.total,
        tests: tests.total
      }
    };
  }

  async courseCategories(courseId) {
    await this.getCourse(courseId, { publishedOnly: true });
    const { items } = await repos.groups.findMany({
      filters: { courseId, isActive: true },
      limit: 100,
      orderBy: 'display_order',
      order: 'asc'
    });
    return items.map((group) => ({
      id: group.id,
      name: group.name,
      slug: group.slug,
      type: 'group'
    }));
  }

  listGroups(query, filters = {}) {
    return list(repos.groups, query, filters);
  }

  async getGroup(groupId) {
    return requireRow(repos.groups, groupId, 'Group');
  }

  async createGroup(payload) {
    await requireRow(repos.courses, payload.courseId, 'Course');
    return repos.groups.create({
      ...payload,
      slug: payload.slug || slugify(payload.name)
    });
  }

  async updateGroup(groupId, payload) {
    await requireRow(repos.groups, groupId, 'Group');
    return repos.groups.update(groupId, payload);
  }

  async deleteGroup(groupId) {
    await requireRow(repos.groups, groupId, 'Group');
    await repos.groups.remove(groupId);
    return { message: 'Group deleted' };
  }

  listClasses(query, filters = {}) {
    return list(repos.classes, query, filters);
  }

  async getClass(classId) {
    return requireRow(repos.classes, classId, 'Class');
  }

  async createClass(payload) {
    await requireRow(repos.groups, payload.groupId, 'Group');
    return repos.classes.create({
      ...payload,
      slug: payload.slug || slugify(payload.name)
    });
  }

  async updateClass(classId, payload) {
    await requireRow(repos.classes, classId, 'Class');
    return repos.classes.update(classId, payload);
  }

  async deleteClass(classId) {
    await requireRow(repos.classes, classId, 'Class');
    await repos.classes.remove(classId);
    return { message: 'Class deleted' };
  }

  listSubjects(query, filters = {}) {
    return list(repos.subjects, query, filters);
  }

  async getSubject(subjectId) {
    return requireRow(repos.subjects, subjectId, 'Subject');
  }

  async createSubject(payload) {
    return repos.subjects.create({
      ...payload,
      slug: payload.slug || slugify(payload.name)
    });
  }

  async updateSubject(subjectId, payload) {
    await requireRow(repos.subjects, subjectId, 'Subject');
    return repos.subjects.update(subjectId, payload);
  }

  async deleteSubject(subjectId) {
    await requireRow(repos.subjects, subjectId, 'Subject');
    await repos.subjects.remove(subjectId);
    return { message: 'Subject deleted' };
  }
}

export default new CatalogService();
