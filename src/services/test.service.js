import { repos } from '../repositories/repos.js';
import { ATTEMPT_STATUS } from '../config/constants.js';
import { getPaginationParams } from '../utils/pagination.js';
import { badRequest, forbidden, notFound } from '../utils/errors.js';

const hideAnswers = (question) => {
  const { correctAnswer, ...safe } = question;
  return safe;
};

const syncTestTotals = async (testId) => {
  const { items } = await repos.questions.findMany({ filters: { testId }, limit: 100, orderBy: 'question_number', order: 'asc' });
  const totalMarks = items.reduce((sum, question) => sum + (question.marks || 0), 0);
  return repos.tests.update(testId, {
    totalQuestions: items.length,
    totalMarks
  });
};

export class TestService {
  async listTests(query, { admin = false } = {}) {
    const { page, limit } = getPaginationParams(query);
    const filters = admin ? {} : { isPublished: true };
    if (query.courseId) filters.courseId = query.courseId;
    if (query.groupId) filters.groupId = query.groupId;
    if (query.subjectId) filters.subjectId = query.subjectId;

    const { items, total } = await repos.tests.findMany({
      filters,
      page,
      limit,
      search: query.search,
      searchFields: ['title', 'description']
    });
    return { items, total, page, limit };
  }

  async getTest(testId, { admin = false, includeQuestions = false } = {}) {
    const test = await repos.tests.findById(testId);
    if (!test || (!admin && !test.isPublished)) throw notFound('Test');

    if (!includeQuestions) return test;

    const { items } = await repos.questions.findMany({
      filters: { testId },
      limit: 100,
      orderBy: 'question_number',
      order: 'asc'
    });

    return {
      ...test,
      questions: admin ? items : items.map(hideAnswers)
    };
  }

  async createTest(payload) {
    return repos.tests.create(payload);
  }

  async updateTest(testId, payload) {
    await this.getTest(testId, { admin: true });
    return repos.tests.update(testId, payload);
  }

  async deleteTest(testId) {
    await this.getTest(testId, { admin: true });
    await repos.tests.remove(testId);
    return { message: 'Test deleted' };
  }

  async addQuestion(testId, payload) {
    await this.getTest(testId, { admin: true });
    const question = await repos.questions.create({ ...payload, testId });
    await syncTestTotals(testId);
    return question;
  }

  async updateQuestion(questionId, payload) {
    const question = await repos.questions.findById(questionId);
    if (!question) throw notFound('Question');
    const updated = await repos.questions.update(questionId, payload);
    await syncTestTotals(question.testId);
    return updated;
  }

  async deleteQuestion(questionId) {
    const question = await repos.questions.findById(questionId);
    if (!question) throw notFound('Question');
    await repos.questions.remove(questionId);
    await syncTestTotals(question.testId);
    return { message: 'Question deleted' };
  }

  async startTest(userId, testId) {
    const test = await this.getTest(testId, { includeQuestions: true });
    const existing = await repos.attempts.findOne({ userId, testId, status: ATTEMPT_STATUS.IN_PROGRESS });
    if (existing) {
      return this.getAttempt(userId, existing.id);
    }

    const attempt = await repos.attempts.create({
      testId,
      userId,
      status: ATTEMPT_STATUS.IN_PROGRESS
    });

    return {
      attempt,
      test: {
        id: test.id,
        title: test.title,
        duration: test.duration,
        totalQuestions: test.totalQuestions,
        totalMarks: test.totalMarks
      },
      questions: test.questions
    };
  }

  async getAttempt(userId, attemptId, { admin = false } = {}) {
    const attempt = await repos.attempts.findById(attemptId);
    if (!attempt) throw notFound('Attempt');
    if (!admin && attempt.userId !== userId) throw forbidden('You cannot view this attempt');

    const test = await this.getTest(attempt.testId, {
      admin,
      includeQuestions: true
    });
    const { items: answers } = await repos.answers.findMany({ filters: { attemptId }, limit: 100 });

    const questions = (test.questions || []).map((question) => (
      attempt.status === ATTEMPT_STATUS.IN_PROGRESS && !admin ? hideAnswers(question) : question
    ));

    return { attempt, test: { ...test, questions }, answers };
  }

  async saveAnswers(userId, attemptId, answers) {
    const { attempt } = await this.getAttempt(userId, attemptId);
    if (attempt.status !== ATTEMPT_STATUS.IN_PROGRESS) {
      throw badRequest('This attempt is already submitted');
    }

    const saved = [];
    for (const answer of answers) {
      const existing = await repos.answers.findOne({ attemptId, questionId: answer.questionId });
      if (existing) {
        saved.push(await repos.answers.update(existing.id, { selectedAnswer: answer.selectedAnswer }));
      } else {
        saved.push(await repos.answers.create({
          attemptId,
          questionId: answer.questionId,
          selectedAnswer: answer.selectedAnswer
        }));
      }
    }
    return saved;
  }

  async submitAttempt(userId, attemptId) {
    const { attempt } = await this.getAttempt(userId, attemptId);
    if (attempt.status !== ATTEMPT_STATUS.IN_PROGRESS) {
      throw badRequest('This attempt is already submitted');
    }

    const { items: questions } = await repos.questions.findMany({
      filters: { testId: attempt.testId },
      limit: 100,
      orderBy: 'question_number',
      order: 'asc'
    });
    const { items: answers } = await repos.answers.findMany({ filters: { attemptId }, limit: 100 });
    const answerMap = new Map(answers.map((item) => [item.questionId, item]));

    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;
    const totalMarks = questions.reduce((sum, question) => sum + (question.marks || 0), 0);

    for (const question of questions) {
      const answer = answerMap.get(question.id);
      if (!answer?.selectedAnswer) {
        unansweredCount += 1;
        continue;
      }

      const isCorrect = String(answer.selectedAnswer).trim().toLowerCase() === String(question.correctAnswer).trim().toLowerCase();
      const marksAwarded = isCorrect ? question.marks : -(question.negativeMarks || 0);
      score += marksAwarded;
      if (isCorrect) correctCount += 1;
      else wrongCount += 1;
      await repos.answers.update(answer.id, { isCorrect, marksAwarded });
    }

    const test = await repos.tests.findById(attempt.testId);
    const percentage = totalMarks ? Number(((score / totalMarks) * 100).toFixed(2)) : 0;
    const timeSpent = Math.max(0, Math.round((Date.now() - new Date(attempt.startedAt).getTime()) / 1000));

    await repos.attempts.update(attemptId, {
      status: ATTEMPT_STATUS.SUBMITTED,
      submittedAt: new Date().toISOString()
    });

    const result = await repos.results.create({
      attemptId,
      userId,
      testId: attempt.testId,
      score,
      totalMarks,
      correctCount,
      wrongCount,
      unansweredCount,
      percentage,
      passed: score >= (test.passingMarks || 0),
      timeSpent
    });

    await repos.activity.create({
      userId,
      activityType: 'test_completed',
      metadata: { testId: attempt.testId, attemptId, score, percentage }
    });

    return result;
  }

  async getResult(userId, attemptId) {
    const { attempt } = await this.getAttempt(userId, attemptId);
    const result = await repos.results.findOne({ attemptId });
    if (!result) throw notFound('Result');

    const { items: questions } = await repos.questions.findMany({
      filters: { testId: attempt.testId },
      limit: 100,
      orderBy: 'question_number',
      order: 'asc'
    });
    const { items: answers } = await repos.answers.findMany({ filters: { attemptId }, limit: 100 });
    const answerMap = new Map(answers.map((item) => [item.questionId, item]));

    return {
      result,
      questions: questions.map((question) => ({
        ...question,
        selectedAnswer: answerMap.get(question.id)?.selectedAnswer || null,
        isCorrect: answerMap.get(question.id)?.isCorrect ?? null,
        marksAwarded: answerMap.get(question.id)?.marksAwarded || 0
      }))
    };
  }

  async listMyAttempts(userId, query) {
    const { page, limit } = getPaginationParams(query);
    const { items, total } = await repos.attempts.findMany({
      filters: { userId },
      page,
      limit
    });
    return { items, total, page, limit };
  }

  async testHistory(userId, query) {
    const { page, limit } = getPaginationParams(query);
    const { items, total } = await repos.results.findMany({
      filters: { userId },
      page,
      limit
    });
    return { items, total, page, limit };
  }
}

export default new TestService();
