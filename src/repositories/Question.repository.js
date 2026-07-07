import { supabaseAdmin } from '../services/supabaseClient.js';
import { Question } from '../models/Question.model.js';
import { PAGINATION } from '../config/constants.js';

export class QuestionRepository {
  async create(questionData) {
    const { data: question, error: questionError } = await supabaseAdmin
      .from('questions')
      .insert({
        exam_id: questionData.examId,
        subject_id: questionData.subjectId,
        question_text: questionData.questionText,
        question_type: questionData.questionType,
        marks: questionData.marks,
        explanation: questionData.explanation,
        image_url: questionData.imageUrl,
        order_index: questionData.orderIndex || 0,
        created_by: questionData.createdBy
      })
      .select('*')
      .single();

    if (questionError) throw questionError;

    if (questionData.options && questionData.options.length > 0) {
      const options = questionData.options.map(opt => ({
        question_id: question.id,
        option_text: opt.optionText,
        is_correct: opt.isCorrect,
        order_index: opt.orderIndex || 0
      }));

      const { data: createdOptions, error: optionsError } = await supabaseAdmin
        .from('options')
        .insert(options)
        .select('*');

      if (optionsError) throw optionsError;

      question.options = createdOptions;
    }

    return Question.fromDB(question);
  }

  async findById(id) {
    const { data, error } = await supabaseAdmin
      .from('questions')
      .select('*, options(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data ? Question.fromDB(data) : null;
  }

  async findByExamId(examId, shuffle = false) {
    const { data, error } = await supabaseAdmin
      .from('questions')
      .select('*, options(*)')
      .eq('exam_id', examId)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) throw error;

    let questions = data.map(item => Question.fromDB(item));

    if (shuffle) {
      questions = this.shuffleArray(questions);
    }

    return questions;
  }

  async findAll(filters = {}, pagination = {}) {
    const page = pagination.page || PAGINATION.DEFAULT_PAGE;
    const limit = pagination.limit || PAGINATION.DEFAULT_LIMIT;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('questions')
      .select('*, options(*)', { count: 'exact' });

    if (filters.examId) {
      query = query.eq('exam_id', filters.examId);
    }
    if (filters.subjectId) {
      query = query.eq('subject_id', filters.subjectId);
    }
    if (filters.questionType) {
      query = query.eq('question_type', filters.questionType);
    }
    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }
    if (filters.search) {
      query = query.ilike('question_text', `%${filters.search}%`);
    }

    const { data, error, count } = await query
      .order('order_index', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      questions: data.map(item => Question.fromDB(item)),
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    };
  }

  async update(id, questionData) {
    const updateData = {};
    if (questionData.questionText !== undefined) updateData.question_text = questionData.questionText;
    if (questionData.questionType !== undefined) updateData.question_type = questionData.questionType;
    if (questionData.marks !== undefined) updateData.marks = questionData.marks;
    if (questionData.explanation !== undefined) updateData.explanation = questionData.explanation;
    if (questionData.imageUrl !== undefined) updateData.image_url = questionData.imageUrl;
    if (questionData.orderIndex !== undefined) updateData.order_index = questionData.orderIndex;
    if (questionData.isActive !== undefined) updateData.is_active = questionData.isActive;

    const { data, error } = await supabaseAdmin
      .from('questions')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    if (questionData.options && questionData.options.length > 0) {
      await supabaseAdmin
        .from('options')
        .delete()
        .eq('question_id', id);

      const options = questionData.options.map(opt => ({
        question_id: id,
        option_text: opt.optionText,
        is_correct: opt.isCorrect,
        order_index: opt.orderIndex || 0
      }));

      const { data: createdOptions, error: optionsError } = await supabaseAdmin
        .from('options')
        .insert(options)
        .select('*');

      if (optionsError) throw optionsError;

      data.options = createdOptions;
    }

    return Question.fromDB(data);
  }

  async delete(id) {
    const { error } = await supabaseAdmin
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

export default new QuestionRepository();
