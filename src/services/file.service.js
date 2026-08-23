import { supabaseAdmin } from '../services/supabaseClient.js';
import { FILE_UPLOAD } from '../config/constants.js';
import { ERROR_CODES, HTTP_STATUS } from '../config/constants.js';
import logger from '../config/logger.js';

export class FileService {
  async uploadFile(file, path) {
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = `${path}/${fileName}`;

    const { data, error } = await supabaseAdmin.storage
      .from('uploads')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      logger.error('File upload error:', error);
      const err = new Error('File upload failed');
      err.code = ERROR_CODES.INTERNAL_ERROR;
      err.statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
      throw err;
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('uploads')
      .getPublicUrl(filePath);

    logger.info(`File uploaded: ${filePath}`);

    return {
      path: filePath,
      url: publicUrl
    };
  }

  async uploadProfileImage(file) {
    return this.uploadFile(file, FILE_UPLOAD.PROFILE_IMAGE_PATH);
  }

  async uploadQuestionImage(file) {
    return this.uploadFile(file, FILE_UPLOAD.QUESTION_IMAGE_PATH);
  }

  async uploadContent(file) {
    return this.uploadFile(file, FILE_UPLOAD.CONTENT_PATH);
  }

  async uploadVideoAsset(file) {
    return this.uploadFile(file, FILE_UPLOAD.VIDEO_PATH);
  }

  async uploadCurrentAffair(file) {
    return this.uploadFile(file, FILE_UPLOAD.CURRENT_AFFAIRS_PATH);
  }

  async deleteFile(filePath) {
    const { error } = await supabaseAdmin.storage
      .from('uploads')
      .remove([filePath]);

    if (error) {
      logger.error('File deletion error:', error);
      const err = new Error('File deletion failed');
      err.code = ERROR_CODES.INTERNAL_ERROR;
      err.statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
      throw err;
    }

    logger.info(`File deleted: ${filePath}`);

    return { message: 'File deleted successfully' };
  }

  async getFileUrl(filePath) {
    const { data, error } = supabaseAdmin.storage
      .from('uploads')
      .getPublicUrl(filePath);

    if (error) {
      const err = new Error('File not found');
      err.code = ERROR_CODES.NOT_FOUND_ERROR;
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }

    return data.publicUrl;
  }
}

export default new FileService();
