import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import adminRepository from '../repositories/Admin.repository.js';
import studentRepository from '../repositories/Student.repository.js';
import { supabaseAdmin } from '../services/supabaseClient.js';
import { ERROR_CODES, HTTP_STATUS, JWT_CONFIG } from '../config/constants.js';
import logger from '../config/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export class AuthService {
  async registerAdmin(adminData) {
    const existingAdmin = await adminRepository.findByEmail(adminData.email);
    if (existingAdmin) {
      const error = new Error('Admin with this email already exists');
      error.code = ERROR_CODES.CONFLICT_ERROR;
      error.statusCode = HTTP_STATUS.CONFLICT;
      throw error;
    }

    const passwordHash = await bcrypt.hash(adminData.password, 10);

    const admin = await adminRepository.create({
      ...adminData,
      passwordHash
    });

    // Create Supabase auth user
    const { error: supabaseError } = await supabaseAdmin.auth.admin.createUser({
      email: adminData.email,
      password: adminData.password,
      email_confirm: true
    });

    if (supabaseError) {
      logger.error('Supabase user creation failed:', supabaseError);
    }

    const token = this.generateToken(admin.id, 'admin', admin.roleId);

    return {
      admin: admin.toJSON(),
      token
    };
  }

  async registerStudent(studentData) {
    const existingStudent = await studentRepository.findByEmail(studentData.email);
    if (existingStudent) {
      const error = new Error('Student with this email already exists');
      error.code = ERROR_CODES.CONFLICT_ERROR;
      error.statusCode = HTTP_STATUS.CONFLICT;
      throw error;
    }

    if (studentData.rollNumber) {
      const existingRollNumber = await studentRepository.findByRollNumber(studentData.rollNumber);
      if (existingRollNumber) {
        const error = new Error('Student with this roll number already exists');
        error.code = ERROR_CODES.CONFLICT_ERROR;
        error.statusCode = HTTP_STATUS.CONFLICT;
        throw error;
      }
    }

    const passwordHash = await bcrypt.hash(studentData.password, 10);

    const student = await studentRepository.create({
      ...studentData,
      passwordHash
    });

    // Create Supabase auth user
    const { error: supabaseError } = await supabaseAdmin.auth.admin.createUser({
      email: studentData.email,
      password: studentData.password,
      email_confirm: false
    });

    if (supabaseError) {
      logger.error('Supabase user creation failed:', supabaseError);
    }

    const token = this.generateToken(student.id, 'student');

    return {
      student: student.toJSON(),
      token
    };
  }

  async loginAdmin(email, password) {
    const admin = await adminRepository.findByEmail(email);
    if (!admin) {
      const error = new Error('Invalid credentials');
      error.code = ERROR_CODES.AUTHENTICATION_ERROR;
      error.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw error;
    }

    if (!admin.isActive) {
      const error = new Error('Account is deactivated');
      error.code = ERROR_CODES.AUTHENTICATION_ERROR;
      error.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw error;
    }

    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isPasswordValid) {
      const error = new Error('Invalid credentials');
      error.code = ERROR_CODES.AUTHENTICATION_ERROR;
      error.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw error;
    }

    await adminRepository.updateLastLogin(admin.id);

    const token = this.generateToken(admin.id, 'admin', admin.roleId);

    return {
      admin: admin.toJSON(),
      token
    };
  }

  async loginStudent(email, password) {
    const student = await studentRepository.findByEmail(email);
    if (!student) {
      const error = new Error('Invalid credentials');
      error.code = ERROR_CODES.AUTHENTICATION_ERROR;
      error.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw error;
    }

    if (!student.isActive) {
      const error = new Error('Account is deactivated');
      error.code = ERROR_CODES.AUTHENTICATION_ERROR;
      error.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw error;
    }

    const isPasswordValid = await bcrypt.compare(password, student.passwordHash);
    if (!isPasswordValid) {
      const error = new Error('Invalid credentials');
      error.code = ERROR_CODES.AUTHENTICATION_ERROR;
      error.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw error;
    }

    await studentRepository.updateLastLogin(student.id);

    const token = this.generateToken(student.id, 'student');

    return {
      student: student.toJSON(),
      token
    };
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded;
    } catch (error) {
      const err = new Error('Invalid or expired token');
      err.code = ERROR_CODES.AUTHENTICATION_ERROR;
      err.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw err;
    }
  }

  generateToken(userId, userType, roleId = null) {
    const payload = {
      userId,
      userType,
      roleId
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY
    });
  }

  async changePassword(userId, userType, currentPassword, newPassword) {
    let user;
    if (userType === 'admin') {
      user = await adminRepository.findById(userId);
    } else {
      user = await studentRepository.findById(userId);
    }

    if (!user) {
      const error = new Error('User not found');
      error.code = ERROR_CODES.NOT_FOUND_ERROR;
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      const error = new Error('Current password is incorrect');
      error.code = ERROR_CODES.AUTHENTICATION_ERROR;
      error.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw error;
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    if (userType === 'admin') {
      await adminRepository.update(userId, { passwordHash: newPasswordHash });
    } else {
      await studentRepository.update(userId, { passwordHash: newPasswordHash });
    }

    return { message: 'Password changed successfully' };
  }

  async forgotPassword(email, userType) {
    let user;
    if (userType === 'admin') {
      user = await adminRepository.findByEmail(email);
    } else {
      user = await studentRepository.findByEmail(email);
    }

    if (!user) {
      const error = new Error('User not found');
      error.code = ERROR_CODES.NOT_FOUND_ERROR;
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    const resetToken = jwt.sign(
      { userId: user.id, userType },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // TODO: Send email with reset token
    logger.info(`Password reset token for ${email}: ${resetToken}`);

    return { message: 'Password reset link sent to email' };
  }

  async resetPassword(token, newPassword) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      if (decoded.userType === 'admin') {
        await adminRepository.update(decoded.userId, { passwordHash: newPasswordHash });
      } else {
        await studentRepository.update(decoded.userId, { passwordHash: newPasswordHash });
      }

      return { message: 'Password reset successful' };
    } catch (error) {
      const err = new Error('Invalid or expired reset token');
      err.code = ERROR_CODES.AUTHENTICATION_ERROR;
      err.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw err;
    }
  }
}

export default new AuthService();
