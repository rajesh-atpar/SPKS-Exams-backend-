import { repos } from '../repositories/repos.js';
import { ATTEMPT_STATUS } from '../config/constants.js';
import { getPaginationParams } from '../utils/pagination.js';
import { badRequest, forbidden, notFound } from '../utils/errors.js';
import fileService from './file.service.js';
import accessService from './access.service.js';
import progressService from './progress.service.js';

const optionText = (item) => {
  if (item == null) return '';
  if (typeof item === 'string' || typeof item === 'number') return String(item).trim();
  if (typeof item === 'object') {
    return String(item.text || item.label || item.option || item.value || item.title || '').trim();
  }
  return String(item).trim();
};

const normalizeOptions = (value) => {
  const list = Array.isArray(value) ? value : [];
  const seen = new Set();
  const options = [];
  for (const item of list) {
    const text = optionText(item);
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    options.push(text);
  }
  return options;
};

const resolveCorrectAnswer = (correctAnswer, options) => {
  const raw = String(correctAnswer ?? '').trim();
  if (!raw) return '';
  if (/^\d+$/.test(raw) && options[Number(raw)]) return options[Number(raw)];
  const match = options.find((option) => option.toLowerCase() === raw.toLowerCase());
  return match || raw;
};

const answersMatch = (selected, correct) => (
  String(selected || '').trim().toLowerCase() === String(correct || '').trim().toLowerCase()
);

const toAppTest = (test) => {
  if (!test) return test;
  return {
    ...test,
    category: 'test',
    totalQuestions: test.totalQuestions || 0
  };
};

const publicQuestion = (question) => ({
  id: question.id,
  testId: question.testId,
  question: question.question,
  questionImage: question.questionImage || null,
  options: normalizeOptions(question.options),
  questionNumber: question.questionNumber || 0,
  marks: question.marks || 1
});

const hideAnswers = (question) => {
  const { correctAnswer, explanation, ...safe } = question;
  return {
    ...safe,
    options: normalizeOptions(question.options)
  };
};

const reviewQuestion = (question, answer) => ({
  ...question,
  options: normalizeOptions(question.options),
  selectedAnswer: answer?.selectedAnswer || null,
  isCorrect: answer?.isCorrect ?? null,
  marksAwarded: answer?.marksAwarded || 0
});

const toUserResult = (result, extras = {}) => {
  if (!result) return result;
  return {
    ...result,
    ...extras,
    userId: result.userId,
    attemptId: result.attemptId,
    testId: result.testId,
    score: result.score,
    totalMarks: result.totalMarks,
    total: extras.total ?? result.total ?? ((result.correctCount || 0) + (result.wrongCount || 0) + (result.unansweredCount || 0)),
    correct: result.correctCount,
    correctCount: result.correctCount,
    incorrect: result.wrongCount,
    wrongCount: result.wrongCount,
    unanswered: result.unansweredCount,
    unansweredCount: result.unansweredCount,
    percentage: result.percentage,
    passed: result.passed,
    timeSpent: result.timeSpent
  };
};

const listQuestions = async (testId) => {
  const { items } = await repos.questions.findMany({
    filters: { testId },
    limit: 100,
    orderBy: 'question_number',
    order: 'asc'
  });
  return items;
};

const syncTestTotals = async (testId) => {
  const items = await listQuestions(testId);
  const totalMarks = items.reduce((sum, question) => sum + (question.marks || 0), 0);
  const payload = {
    totalQuestions: items.length,
    totalMarks
  };
  if (items.length) payload.isPublished = true;
  return repos.tests.update(testId, payload);
};

const prepareQuestionPayload = (payload, existing = {}) => {
  const next = { ...payload };
  const optionSource = payload.options !== undefined ? payload.options : existing.options;
  const options = normalizeOptions(optionSource);

  if (payload.options !== undefined) {
    if (options.length < 2) throw badRequest('At least two options are required');
    next.options = options;
  }

  if (payload.correctAnswer !== undefined || payload.options !== undefined) {
    const resolved = resolveCorrectAnswer(payload.correctAnswer ?? existing.correctAnswer, options);
    if (options.length && !options.some((option) => answersMatch(option, resolved))) {
      throw badRequest('correctAnswer must match one of the options');
    }
    next.correctAnswer = resolved;
  }

  return next;
};

const testsByIds = async (ids) => {
  const unique = [...new Set((ids || []).filter(Boolean))];
  const map = new Map();
  if (!unique.length) return map;

  try {
    const { items } = await repos.tests.findMany({
      inFilters: { id: unique },
      limit: Math.max(unique.length, 1)
    });
    items.forEach((test) => map.set(test.id, test));
  } catch {
    // Fall through to per-id lookups.
  }

  for (const id of unique) {
    if (map.has(id)) continue;
    const test = await repos.tests.findById(id);
    if (test) map.set(id, test);
  }
  return map;
};

const enrichHistoryItem = (result, test) => {
  const title = test?.title || 'Test';
  return toUserResult(result, {
    id: result.attemptId,
    resultId: result.id,
    title,
    testTitle: title,
    submittedAt: result.createdAt
  });
};

export class TestService {
  async listTests(query, { admin = false, user = null } = {}) {
    const { page, limit } = getPaginationParams(query);
    const filters = {};
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
    const visible = admin ? items : items.filter((test) => test.isPublished !== false);
    const mapped = admin ? visible : await accessService.applyList(visible.map(toAppTest), user);
    return { items: mapped, total: admin ? total : mapped.length, page, limit };
  }

  async getTest(testId, { admin = false, includeQuestions = false, user = null } = {}) {
    const test = await repos.tests.findById(testId);
    if (!test || (!admin && test.isPublished === false)) throw notFound('Test');

    if (!includeQuestions) {
      const payload = toAppTest(test);
      return admin ? payload : accessService.applyItem(payload, user);
    }

    const items = await listQuestions(testId);
    const payload = {
      ...toAppTest(test),
      questions: admin ? items.map((question) => ({ ...question, options: normalizeOptions(question.options) })) : items.map(hideAnswers)
    };
    return admin ? payload : accessService.applyItem(payload, user);
  }

  async createTest(payload) {
    let courseId = payload.courseId || null;
    if (payload.groupId && !courseId) {
      const group = await repos.groups.findById(payload.groupId);
      if (!group) throw notFound('Group');
      courseId = group.courseId || null;
    }
    return repos.tests.create({
      ...payload,
      courseId,
      isPublished: payload.isPublished !== false
    });
  }

  async updateTest(testId, payload) {
    await this.getTest(testId, { admin: true });
    const next = { ...payload };
    if (payload.groupId && !payload.courseId) {
      const group = await repos.groups.findById(payload.groupId);
      if (group?.courseId) next.courseId = group.courseId;
    }
    return repos.tests.update(testId, next);
  }

  async deleteTest(testId) {
    await this.getTest(testId, { admin: true });
    await repos.tests.remove(testId);
    return { message: 'Test deleted' };
  }

  async addQuestion(testId, payload) {
    await this.getTest(testId, { admin: true });
    const items = await listQuestions(testId);
    const question = await repos.questions.create({
      ...prepareQuestionPayload(payload),
      testId,
      questionNumber: payload.questionNumber || items.length + 1
    });
    await syncTestTotals(testId);
    return { ...question, options: normalizeOptions(question.options) };
  }

  async updateQuestion(questionId, payload) {
    const question = await repos.questions.findById(questionId);
    if (!question) throw notFound('Question');
    const updated = await repos.questions.update(questionId, prepareQuestionPayload(payload, question));
    await syncTestTotals(question.testId);
    return { ...updated, options: normalizeOptions(updated.options) };
  }

  async deleteQuestion(questionId) {
    const question = await repos.questions.findById(questionId);
    if (!question) throw notFound('Question');
    await repos.questions.remove(questionId);
    await syncTestTotals(question.testId);
    return { message: 'Question deleted' };
  }

  async uploadQuestionImage(file) {
    return fileService.uploadQuestionImage(file);
  }

  async startTest(userId, testId) {
    const published = await repos.tests.findById(testId);
    if (!published || published.isPublished === false) throw notFound('Test');
    await accessService.assertUnlocked({ id: userId }, published, 'This test');

    const test = await this.getTest(testId, { includeQuestions: true, user: { id: userId } });
    const existing = await repos.attempts.findOne({ userId, testId, status: ATTEMPT_STATUS.IN_PROGRESS });
    if (existing) {
      return this.getAttempt(userId, existing.id);
    }

    const attempt = await repos.attempts.create({
      testId,
      userId,
      status: ATTEMPT_STATUS.IN_PROGRESS
    });
    const questions = (test.questions || []).map(publicQuestion);

    return {
      attempt,
      test: {
        id: test.id,
        title: test.title,
        duration: test.duration,
        totalQuestions: test.totalQuestions,
        totalMarks: test.totalMarks,
        groupId: test.groupId,
        courseId: test.courseId,
        category: 'test'
      },
      questions,
      answers: []
    };
  }

  async resolveAttempt(userId, attemptId, { admin = false } = {}) {
    let attempt = await repos.attempts.findById(attemptId);
    if (!attempt) {
      const result = await repos.results.findById(attemptId);
      if (result) attempt = await repos.attempts.findById(result.attemptId);
    }
    if (!attempt) throw notFound('Attempt');
    if (!admin && attempt.userId !== userId) throw forbidden('You cannot view this attempt');
    return attempt;
  }

  async getAttempt(userId, attemptId, { admin = false } = {}) {
    const attempt = await this.resolveAttempt(userId, attemptId, { admin });
    const test = await this.getTest(attempt.testId, {
      admin,
      includeQuestions: true
    });
    const { items: answers } = await repos.answers.findMany({ filters: { attemptId: attempt.id }, limit: 100 });
    const inProgress = attempt.status === ATTEMPT_STATUS.IN_PROGRESS && !admin;
    const questions = (test.questions || []).map((question) => (
      inProgress ? publicQuestion(question) : { ...question, options: normalizeOptions(question.options) }
    ));

    return {
      attempt,
      test: { ...test, questions },
      questions,
      answers
    };
  }

  async saveAnswers(userId, attemptId, answers) {
    const { attempt } = await this.getAttempt(userId, attemptId);
    if (attempt.status !== ATTEMPT_STATUS.IN_PROGRESS) {
      throw badRequest('This attempt is already submitted');
    }

    const saved = [];
    for (const answer of answers) {
      if (!answer?.questionId) continue;
      const existing = await repos.answers.findOne({ attemptId: attempt.id, questionId: answer.questionId });
      const payload = { selectedAnswer: answer.selectedAnswer };
      if (existing) {
        saved.push(await repos.answers.update(existing.id, payload));
      } else {
        saved.push(await repos.answers.create({
          attemptId: attempt.id,
          questionId: answer.questionId,
          selectedAnswer: answer.selectedAnswer
        }));
      }
    }
    return saved;
  }

  async submitAttempt(userId, attemptId, incomingAnswers = []) {
    if (Array.isArray(incomingAnswers) && incomingAnswers.length) {
      await this.saveAnswers(userId, attemptId, incomingAnswers);
    }

    const { attempt } = await this.getAttempt(userId, attemptId);
    if (attempt.status !== ATTEMPT_STATUS.IN_PROGRESS) {
      throw badRequest('This attempt is already submitted');
    }

    const questions = await listQuestions(attempt.testId);
    const { items: answers } = await repos.answers.findMany({ filters: { attemptId: attempt.id }, limit: 100 });
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

      const isCorrect = answersMatch(answer.selectedAnswer, question.correctAnswer);
      const marksAwarded = isCorrect ? question.marks : -(question.negativeMarks || 0);
      score += marksAwarded;
      if (isCorrect) correctCount += 1;
      else wrongCount += 1;
      await repos.answers.update(answer.id, { isCorrect, marksAwarded });
    }

    const test = await repos.tests.findById(attempt.testId);
    const percentage = totalMarks ? Number(((score / totalMarks) * 100).toFixed(2)) : 0;
    const timeSpent = Math.max(0, Math.round((Date.now() - new Date(attempt.startedAt).getTime()) / 1000));

    await repos.attempts.update(attempt.id, {
      status: ATTEMPT_STATUS.SUBMITTED,
      submittedAt: new Date().toISOString()
    });

    const result = await repos.results.create({
      attemptId: attempt.id,
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

    await progressService.recordTestProgress(userId, test, result);

    try {
      await repos.notifications.create({
        userId,
        title: 'Test result ready',
        body: `You scored ${percentage}% on ${test.title}.`,
        type: 'test-result',
        data: {
          attemptId: attempt.id,
          resultId: result.id,
          testId: test.id,
          userId
        }
      });
    } catch {
      // Result is already stored for the user even if the notification fails.
    }

    const review = await this.getResult(userId, attempt.id);
    return {
      ...review.result,
      result: review.result,
      questions: review.questions
    };
  }

  async getResult(userId, attemptId, { admin = false } = {}) {
    const attempt = await this.resolveAttempt(userId, attemptId, { admin });
    const result = await repos.results.findOne({ attemptId: attempt.id });
    if (!result) throw notFound('Result');

    const questions = await listQuestions(attempt.testId);
    const { items: answers } = await repos.answers.findMany({ filters: { attemptId: attempt.id }, limit: 100 });
    const answerMap = new Map(answers.map((item) => [item.questionId, item]));
    const test = await repos.tests.findById(attempt.testId);

    return {
      result: toUserResult(result, {
        title: test?.title,
        testTitle: test?.title,
        total: questions.length
      }),
      questions: questions.map((question) => reviewQuestion(question, answerMap.get(question.id))),
      userId: result.userId,
      attemptId: attempt.id
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
    const tests = await testsByIds(items.map((item) => item.testId));
    return {
      items: items.map((item) => enrichHistoryItem(item, tests.get(item.testId))),
      total,
      page,
      limit
    };
  }

  async listResults(query, { userId, testId } = {}) {
    const { page, limit } = getPaginationParams(query);
    const filters = {};
    if (userId || query.userId) filters.userId = userId || query.userId;
    if (testId || query.testId) filters.testId = testId || query.testId;

    const { items, total } = await repos.results.findMany({
      filters,
      page,
      limit
    });
    const tests = await testsByIds(items.map((item) => item.testId));
    return {
      items: items.map((item) => enrichHistoryItem(item, tests.get(item.testId))),
      total,
      page,
      limit
    };
  }
}

export default new TestService();
