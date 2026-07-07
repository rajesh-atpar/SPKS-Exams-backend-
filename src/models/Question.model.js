export class Question {
  constructor(data) {
    this.id = data.id;
    this.examId = data.exam_id;
    this.subjectId = data.subject_id;
    this.questionText = data.question_text;
    this.questionType = data.question_type;
    this.marks = data.marks;
    this.explanation = data.explanation;
    this.imageUrl = data.image_url;
    this.orderIndex = data.order_index;
    this.isActive = data.is_active;
    this.createdBy = data.created_by;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    this.options = data.options;
  }

  toJSON() {
    return {
      id: this.id,
      examId: this.examId,
      subjectId: this.subjectId,
      questionText: this.questionText,
      questionType: this.questionType,
      marks: this.marks,
      explanation: this.explanation,
      imageUrl: this.imageUrl,
      orderIndex: this.orderIndex,
      isActive: this.isActive,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      options: this.options
    };
  }

  static fromDB(data) {
    return new Question(data);
  }
}
