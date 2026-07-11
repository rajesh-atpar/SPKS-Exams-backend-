export class Result {
  constructor(data) {
    this.id = data.id;
    this.attemptId = data.attempt_id;
    this.examId = data.exam_id;
    this.studentId = data.student_id;
    this.totalMarks = data.total_marks;
    this.obtainedMarks = data.obtained_marks;
    this.percentage = data.percentage;
    this.isPassed = data.is_passed;
    this.rank = data.rank;
    this.percentile = data.percentile;
    this.correctAnswers = data.correct_answers;
    this.wrongAnswers = data.wrong_answers;
    this.skippedAnswers = data.skipped_answers;
    this.negativeMarks = data.negative_marks;
    this.sectionWiseScores = data.section_wise_scores;
    this.generatedAt = data.generated_at;
    this.exam = data.exams;
    this.student = data.students;
  }

  toJSON() {
    return {
      id: this.id,
      attemptId: this.attemptId,
      examId: this.examId,
      exam: this.exam,
      studentId: this.studentId,
      student: this.student,
      totalMarks: this.totalMarks,
      obtainedMarks: this.obtainedMarks,
      percentage: this.percentage,
      isPassed: this.isPassed,
      rank: this.rank,
      percentile: this.percentile,
      correctAnswers: this.correctAnswers,
      wrongAnswers: this.wrongAnswers,
      skippedAnswers: this.skippedAnswers,
      negativeMarks: this.negativeMarks,
      sectionWiseScores: this.sectionWiseScores,
      generatedAt: this.generatedAt
    };
  }

  static fromDB(data) {
    return new Result(data);
  }
}
