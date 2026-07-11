export class Subject {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.code = data.code;
    this.description = data.description;
    this.category = data.category;
    this.imageUrl = data.image_url;
    this.isActive = data.is_active;
    this.createdBy = data.created_by;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      code: this.code,
      description: this.description,
      category: this.category,
      imageUrl: this.imageUrl,
      isActive: this.isActive,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromDB(data) {
    return new Subject(data);
  }
}
