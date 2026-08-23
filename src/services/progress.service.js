import { supabaseAdmin } from './supabaseClient.js';
import { repos } from '../repositories/repos.js';

const startOfDay = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export class ProgressService {
  async logActivity(userId, activityType, metadata = {}) {
    return repos.activity.create({ userId, activityType, metadata });
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
    return items;
  }

  async getActivity(userId, query = {}) {
    const limit = Number(query.limit) || 20;
    const { items } = await repos.activity.findMany({ filters: { userId }, limit });
    return items;
  }

  async getStreak(userId) {
    const { data, error } = await supabaseAdmin
      .from('user_activity')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(400);

    if (error) throw error;

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
}

export default new ProgressService();
