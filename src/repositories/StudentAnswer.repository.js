import { supabaseAdmin } from '../services/supabaseClient.js';

export class StudentAnswerRepository {
  async create(answerData) {
    const { data, error } = await supabaseAdmin
      .from('student_answers')
      .insert({
        attempt_id: answerData.attemptId,
        question_id: answerData.questionId,
        selected_options: answerData.selectedOptions,
        text_answer: answerData.textAnswer,
        is_correct: answerData.isCorrect,
        marks_obtained: answerData.marksObtained,
        time_taken_seconds: answerData.timeTakenSeconds
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async update(answerData) {
    const updateData = {};
    if (answerData.selectedOptions !== undefined) updateData.selected_options = answerData.selectedOptions;
    if (answerData.textAnswer !== undefined) updateData.text_answer = answerData.textAnswer;
    if (answerData.isCorrect !== undefined) updateData.is_correct = answerData.isCorrect;
    if (answerData.marksObtained !== undefined) updateData.marks_obtained = answerData.marksObtained;
    if (answerData.timeTakenSeconds !== undefined) updateData.time_taken_seconds = answerData.timeTakenSeconds;

    const { data, error } = await supabaseAdmin
      .from('student_answers')
      .update(updateData)
      .eq('attempt_id', answerData.attemptId)
      .eq('question_id', answerData.questionId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async findByAttemptId(attemptId) {
    const { data, error } = await supabaseAdmin
      .from('student_answers')
      .select('*, questions(*)')
      .eq('attempt_id', attemptId);

    if (error) throw error;
    return data;
  }

  async findByAttemptIdAndQuestionId(attemptId, questionId) {
    const { data, error } = await supabaseAdmin
      .from('student_answers')
      .select('*')
      .eq('attempt_id', attemptId)
      .eq('question_id', questionId)
      .single();

    if (error) return null;
    return data;
  }

  async deleteByAttemptId(attemptId) {
    const { error } = await supabaseAdmin
      .from('student_answers')
      .delete()
      .eq('attempt_id', attemptId);

    if (error) throw error;
    return true;
  }

  async batchCreate(answers) {
    const { data, error } = await supabaseAdmin
      .from('student_answers')
      .insert(answers)
      .select('*');

    if (error) throw error;
    return data;
  }
}

export default new StudentAnswerRepository();
