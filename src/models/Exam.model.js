export class Exam {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.subjectId = data.subject_id;
    this.durationMinutes = data.duration_minutes;
    this.totalMarks = data.total_marks;
    this.passingMarks = data.passing_marks;
    this.passingPercentage = data.passing_percentage;
    this.negativeMarking = data.negative_marking;
    this.instructions = data.instructions;
    this.startDate = data.start_date;
    this.endDate = data.end_date;
    this.isActive = data.is_active;
    this.isPublished = data.is_published;
    this.allowResume = data.allow_resume;
    this.shuffleQuestions = data.shuffle_questions;
    this.showResultsImmediately = data.show_results_immediately;
    this.maxAttempts = data.max_attempts;
    this.createdBy = data.created_by;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    this.subject = data.subjects;
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      subjectId: this.subjectId,
      subject: this.subject,
      durationMinutes: this.durationMinutes,
      totalMarks: this.totalMarks,
      passingMarks: this.passingMarks,
      passingPercentage: this.passingPercentage,
      negativeMarking: this.negativeMarking,
      instructions: this.instructions,
      startDate: this.startDate,
      endDate: this.endDate,
      isActive: this.isActive,
      isPublished: this.isPublished,
      allowResume: this.allowResume,
      shuffleQuestions: this.shuffleQuestions,
      showResultsImmediately: this.showResultsImmediately,
      maxAttempts: this.maxAttempts,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromDB(data) {
    return new Exam(data);
  }
}
