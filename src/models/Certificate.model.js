export class Certificate {
  constructor(data) {
    this.id = data.id;
    this.resultId = data.result_id;
    this.studentId = data.student_id;
    this.examId = data.exam_id;
    this.certificateNumber = data.certificate_number;
    this.issuedDate = data.issued_date;
    this.certificateUrl = data.certificate_url;
    this.isVerified = data.is_verified;
    this.verificationCode = data.verification_code;
    this.createdAt = data.created_at;
    this.student = data.students;
    this.exam = data.exams;
  }

  toJSON() {
    return {
      id: this.id,
      resultId: this.resultId,
      studentId: this.studentId,
      student: this.student,
      examId: this.examId,
      exam: this.exam,
      certificateNumber: this.certificateNumber,
      issuedDate: this.issuedDate,
      certificateUrl: this.certificateUrl,
      isVerified: this.isVerified,
      verificationCode: this.verificationCode,
      createdAt: this.createdAt
    };
  }

  static fromDB(data) {
    return new Certificate(data);
  }
}
