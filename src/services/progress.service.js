import { supabaseAdmin } from './supabaseClient.js';
import { repos } from '../repositories/repos.js';

const startOfDay = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const today = () => new Date().toISOString().slice(0, 10);

const safeFind = async (repo, id) => {
  if (!id) return null;
  try {
    return await repo.findById(id);
  } catch {
    return null;
  }
};

export class ProgressService {
  async logActivity(userId, activityType, metadata = {}) {
    return repos.activity.create({ userId, activityType, metadata });
  }

  async resolveLessonContext(lesson) {
    const chapter = await safeFind(repos.chapters, lesson?.chapterId);
    const subject = await safeFind(repos.subjects, chapter?.subjectId);
    let group = await safeFind(repos.groups, subject?.groupId);
    let courseId = subject?.courseId || group?.courseId || null;
    if (!courseId && group?.courseId) courseId = group.courseId;
    if (!group && subject?.groupId) group = await safeFind(repos.groups, subject.groupId);
    const course = await safeFind(repos.courses, courseId);
    return {
      lesson,
      chapter,
      subject,
      group,
      course,
      courseId,
      groupId: group?.id || subject?.groupId || null,
      chapterId: chapter?.id || null,
      subjectId: subject?.id || null,
      lessonId: lesson?.id || null
    };
  }

  async upsertCourseProgress(userId, courseId, updates = {}) {
    if (!userId || !courseId) return null;

    const existing = await repos.progress.findOne({ userId, courseId });
    const payload = {
      lastActiveDate: today(),
      ...updates
    };

    if (existing) {
      return repos.progress.update(existing.id, payload);
    }

    return repos.progress.create({
      userId,
      courseId,
      questionsAttempted: 0,
      questionsCorrect: 0,
      testsCompleted: 0,
      timeSpent: 0,
      completionPercent: 0,
      ...payload
    });
  }

  async recordLessonAccess(userId, lesson, { completed = false } = {}) {
    const context = await this.resolveLessonContext(lesson);
    await this.logActivity(userId, completed ? 'lesson_completed' : 'lesson_accessed', {
      lessonId: lesson.id,
      chapterId: context.chapterId,
      subjectId: context.subjectId,
      courseId: context.courseId
    });

    const existing = context.courseId
      ? await repos.progress.findOne({ userId, courseId: context.courseId })
      : null;

    let completionPercent = Number(existing?.completionPercent || 0);
    if (completed && context.courseId) {
      const { items: completions } = await repos.lessonCompletions.findMany({ filters: { userId }, limit: 500 });
      completionPercent = Math.min(100, completions.length);
    }

    await this.upsertCourseProgress(userId, context.courseId, {
      lessonId: lesson.id,
      completionPercent
    });

    return context;
  }

  async recordTestProgress(userId, test, result = {}) {
    const courseId = test?.courseId || null;
    await this.logActivity(userId, 'test_completed', {
      testId: test?.id,
      courseId,
      score: result.score,
      percentage: result.percentage
    });

    const existing = courseId ? await repos.progress.findOne({ userId, courseId }) : null;
    await this.upsertCourseProgress(userId, courseId, {
      testsCompleted: (existing?.testsCompleted || 0) + 1,
      questionsAttempted: (existing?.questionsAttempted || 0) + (result.correctCount || 0) + (result.wrongCount || 0) + (result.unansweredCount || 0),
      questionsCorrect: (existing?.questionsCorrect || 0) + (result.correctCount || 0),
      timeSpent: (existing?.timeSpent || 0) + (result.timeSpent || 0)
    });
  }

  async recordVideoAccess(userId, video) {
    await this.logActivity(userId, 'video_viewed', {
      videoId: video?.id,
      courseId: video?.courseId || null,
      groupId: video?.groupId || null
    });
    await this.upsertCourseProgress(userId, video?.courseId, {});
  }

  async recordContentAccess(userId, item) {
    await this.logActivity(userId, 'content_opened', {
      contentId: item?.id,
      courseId: item?.courseId || null,
      groupId: item?.groupId || null,
      contentType: item?.contentType || null
    });
    await this.upsertCourseProgress(userId, item?.courseId, {});
  }

  async getProgress(userId) {
    const [{ items: results }, { items: completions }, { items: activities }] = await Promise.all([
      repos.results.findMany({ filters: { userId }, limit: 100 }),
      repos.lessonCompletions.findMany({ filters: { userId }, limit: 100 }),
      repos.activity.findMany({ filters: { userId }, limit: 100 })
    ]);

    const testsCompleted = results.length;
    const questionsAttempted = results.reduce((sum, item) => sum + item.correctCount + item.wrongCount + item.unansweredCount, 0);
    const questionsCorrect = results.reduce((sum, item) => sum + item.correctCount, 0);
    const averageScore = testsCompleted
      ? Number((results.reduce((sum, item) => sum + Number(item.percentage || 0), 0) / testsCompleted).toFixed(2))
      : 0;
    const timeSpent = results.reduce((sum, item) => sum + (item.timeSpent || 0), 0);
    const lastActiveDate = activities[0]?.createdAt || results[0]?.createdAt || null;

    return {
      questionsAttempted,
      questionsCorrect,
      testsCompleted,
      averageScore,
      courseCompletion: completions.length,
      lessonsCompleted: completions.length,
      lastActiveDate,
      timeSpent
    };
  }

  async getCourseProgress(userId) {
    const { items } = await repos.progress.findMany({ filters: { userId }, limit: 100 });
    return Promise.all(items.map(async (row) => {
      const [course, lesson] = await Promise.all([
        safeFind(repos.courses, row.courseId),
        safeFind(repos.lessons, row.lessonId)
      ]);
      return { ...row, course, lesson };
    }));
  }

  async getActivity(userId, query = {}) {
    const limit = Number(query.limit) || 20;
    const { items } = await repos.activity.findMany({ filters: { userId }, limit });
    return items;
  }

  async getStreak(userId) {
    const fromLocal = async () => {
      const { items } = await repos.activity.findMany({ filters: { userId }, limit: 400 });
      const localDays = new Set(items.map((row) => new Date(row.createdAt).toISOString().slice(0, 10)));
      let localStreak = 0;
      const localCursor = startOfDay();
      while (localDays.has(localCursor.toISOString().slice(0, 10))) {
        localStreak += 1;
        localCursor.setDate(localCursor.getDate() - 1);
      }
      return {
        dailyStreak: localStreak,
        lastActiveDate: items[0]?.createdAt || null
      };
    };

    try {
      const { data, error } = await supabaseAdmin
        .from('user_activity')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(400);

      if (error) return fromLocal();

      const days = new Set((data || []).map((row) => new Date(row.created_at).toISOString().slice(0, 10)));
      let streak = 0;
      const cursor = startOfDay();

      while (days.has(cursor.toISOString().slice(0, 10))) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      }

      return {
        dailyStreak: streak,
        lastActiveDate: data?.[0]?.created_at || null
      };
    } catch {
      return fromLocal();
    }
  }

  async getAnalytics(userId) {
    const [progress, streak] = await Promise.all([
      this.getProgress(userId),
      this.getStreak(userId)
    ]);
    return { ...progress, ...streak };
  }

  async getStats(userId) {
    return this.getAnalytics(userId);
  }

  async getContinueLearning(userId) {
    const [{ items: progressRows }, { items: activities }] = await Promise.all([
      repos.progress.findMany({ filters: { userId }, limit: 20 }),
      repos.activity.findMany({ filters: { userId }, limit: 20 })
    ]);

    const latestProgress = [...progressRows].sort((a, b) => (
      new Date(b.updatedAt || b.lastActiveDate || 0) - new Date(a.updatedAt || a.lastActiveDate || 0)
    ))[0] || null;
    const latestActivity = activities[0] || null;

    const progressTime = latestProgress ? new Date(latestProgress.updatedAt || latestProgress.lastActiveDate || 0).getTime() : 0;
    const activityTime = latestActivity ? new Date(latestActivity.createdAt || 0).getTime() : 0;

    let item = null;

    if (latestProgress?.lessonId && progressTime >= activityTime) {
      const lesson = await safeFind(repos.lessons, latestProgress.lessonId);
      const context = lesson ? await this.resolveLessonContext(lesson) : {};
      const completed = Boolean(await repos.lessonCompletions.findOne({ userId, lessonId: latestProgress.lessonId }));
      item = {
        type: 'lesson',
        lastActiveAt: latestProgress.updatedAt || latestProgress.lastActiveDate,
        completed,
        course: context.course || await safeFind(repos.courses, latestProgress.courseId),
        lesson,
        chapter: context.chapter,
        subject: context.subject,
        group: context.group
      };
    } else if (latestActivity) {
      const meta = latestActivity.metadata || {};
      if (meta.lessonId) {
        const lesson = await safeFind(repos.lessons, meta.lessonId);
        const context = lesson ? await this.resolveLessonContext(lesson) : {};
        item = {
          type: 'lesson',
          lastActiveAt: latestActivity.createdAt,
          completed: latestActivity.activityType === 'lesson_completed',
          course: context.course,
          lesson,
          chapter: context.chapter,
          subject: context.subject,
          group: context.group
        };
      } else if (meta.testId) {
        item = {
          type: 'test',
          lastActiveAt: latestActivity.createdAt,
          test: await safeFind(repos.tests, meta.testId),
          course: await safeFind(repos.courses, meta.courseId)
        };
      } else if (meta.videoId) {
        item = {
          type: 'video',
          lastActiveAt: latestActivity.createdAt,
          video: await safeFind(repos.videos, meta.videoId),
          course: await safeFind(repos.courses, meta.courseId)
        };
      } else if (meta.contentId) {
        item = {
          type: 'content',
          lastActiveAt: latestActivity.createdAt,
          content: await safeFind(repos.content, meta.contentId),
          course: await safeFind(repos.courses, meta.courseId)
        };
      }
    }

    return {
      continue: item,
      recentActivity: activities.slice(0, 10),
      courses: await this.getCourseProgress(userId)
    };
  }
}

export default new ProgressService();
