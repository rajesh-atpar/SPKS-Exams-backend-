export class Notification {
  constructor(data) {
    this.id = data.id;
    this.recipientId = data.recipient_id;
    this.recipientType = data.recipient_type;
    this.title = data.title;
    this.message = data.message;
    this.type = data.type;
    this.isRead = data.is_read;
    this.relatedId = data.related_id;
    this.relatedType = data.related_type;
    this.createdAt = data.created_at;
  }

  toJSON() {
    return {
      id: this.id,
      recipientId: this.recipientId,
      recipientType: this.recipientType,
      title: this.title,
      message: this.message,
      type: this.type,
      isRead: this.isRead,
      relatedId: this.relatedId,
      relatedType: this.relatedType,
      createdAt: this.createdAt
    };
  }

  static fromDB(data) {
    return new Notification(data);
  }
}
