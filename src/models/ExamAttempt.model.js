export class ExamAttempt {
  constructor(data) {
    this.id = data.id;
    this.examId = data.exam_id;
    this.studentId = data.student_id;
    this.attemptNumber = data.attempt_number;
    this.startedAt = data.started_at;
    this.submittedAt = data.submitted_at;
    this.timeTakenSeconds = data.time_taken_seconds;
    this.status = data.status;
    this.ipAddress = data.ip_address;
    this.browserInfo = data.browser_info;
    this.createdAt = data.created_at;
    this.exam = data.exams;
    this.student = data.students;
  }

  toJSON() {
    return {
      id: this.id,
      examId: this.examId,
      exam: this.exam,
      studentId: this.studentId,
      student: this.student,
      attemptNumber: this.attemptNumber,
      startedAt: this.startedAt,
      submittedAt: this.submittedAt,
      timeTakenSeconds: this.timeTakenSeconds,
      status: this.status,
      ipAddress: this.ipAddress,
      browserInfo: this.browserInfo,
      createdAt: this.createdAt
    };
  }

  static fromDB(data) {
    return new ExamAttempt(data);
  }
}
