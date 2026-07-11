export class Admin {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.fullName = data.full_name;
    this.phone = data.phone;
    this.profileImageUrl = data.profile_image_url;
    this.roleId = data.role_id;
    this.isActive = data.is_active;
    this.isSuperAdmin = data.is_super_admin;
    this.lastLoginAt = data.last_login_at;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    this.role = data.roles;
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      fullName: this.fullName,
      phone: this.phone,
      profileImageUrl: this.profileImageUrl,
      roleId: this.roleId,
      role: this.role,
      isActive: this.isActive,
      isSuperAdmin: this.isSuperAdmin,
      lastLoginAt: this.lastLoginAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromDB(data) {
    return new Admin(data);
  }
}
