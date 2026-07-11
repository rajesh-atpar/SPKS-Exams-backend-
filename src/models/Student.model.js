export class Student {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.fullName = data.full_name;
    this.phone = data.phone;
    this.dateOfBirth = data.date_of_birth;
    this.gender = data.gender;
    this.address = data.address;
    this.profileImageUrl = data.profile_image_url;
    this.rollNumber = data.roll_number;
    this.institution = data.institution;
    this.course = data.course;
    this.semester = data.semester;
    this.isActive = data.is_active;
    this.emailVerified = data.email_verified;
    this.lastLoginAt = data.last_login_at;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      fullName: this.fullName,
      phone: this.phone,
      dateOfBirth: this.dateOfBirth,
      gender: this.gender,
      address: this.address,
      profileImageUrl: this.profileImageUrl,
      rollNumber: this.rollNumber,
      institution: this.institution,
      course: this.course,
      semester: this.semester,
      isActive: this.isActive,
      emailVerified: this.emailVerified,
      lastLoginAt: this.lastLoginAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromDB(data) {
    return new Student(data);
  }
}
