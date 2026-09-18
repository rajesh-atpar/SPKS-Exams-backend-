import { Readable } from 'stream';
import { supabaseAdmin } from '../services/supabaseClient.js';
import { FILE_UPLOAD } from '../config/constants.js';
import { ERROR_CODES, HTTP_STATUS } from '../config/constants.js';
import logger from '../config/logger.js';

const pdfNotFound = () => {
  const err = new Error('PDF not found');
  err.code = ERROR_CODES.NOT_FOUND_ERROR;
  err.statusCode = HTTP_STATUS.NOT_FOUND;
  return err;
};

const safePdfName = (filename = 'document.pdf') => {
  const base = String(filename || 'document.pdf').replace(/["\r\n\\/]/g, '_').trim() || 'document.pdf';
  return base.toLowerCase().endsWith('.pdf') ? base : `${base}.pdf`;
};

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

  extractUploadsPath(url) {
    if (!url || typeof url !== 'string') return null;
    try {
      const parsed = new URL(url);
      const markers = [
        '/storage/v1/object/public/uploads/',
        '/storage/v1/object/sign/uploads/'
      ];
      for (const marker of markers) {
        const index = parsed.pathname.indexOf(marker);
        if (index !== -1) {
          return decodeURIComponent(parsed.pathname.slice(index + marker.length));
        }
      }
    } catch {
      return null;
    }
    return null;
  }

  isStorageUrl(url) {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      const supabaseUrl = process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL) : null;
      if (supabaseUrl && parsed.host === supabaseUrl.host) return true;
      return parsed.pathname.includes('/storage/v1/object/');
    } catch {
      return false;
    }
  }

  setInlinePdfHeaders(res, filename) {
    const name = safePdfName(filename);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${name}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.setHeader('X-Robots-Tag', 'noindex');
    res.removeHeader('X-Frame-Options');
  }

  async streamPdf(res, { filePath, fileUrl, filename = 'document.pdf' }) {
    const path = filePath || this.extractUploadsPath(fileUrl);
    if (path) {
      const { data, error } = await supabaseAdmin.storage
        .from('uploads')
        .download(path);

      if (!error && data) {
        this.setInlinePdfHeaders(res, filename);
        const buffer = Buffer.from(await data.arrayBuffer());
        res.setHeader('Content-Length', buffer.length);
        res.end(buffer);
        return;
      }
    }

    if (fileUrl && this.isStorageUrl(fileUrl)) {
      const response = await fetch(fileUrl);
      if (!response.ok || !response.body) throw pdfNotFound();
      this.setInlinePdfHeaders(res, filename);
      const length = response.headers.get('content-length');
      if (length) res.setHeader('Content-Length', length);
      Readable.fromWeb(response.body).pipe(res);
      return;
    }

    throw pdfNotFound();
  }

  async deleteQuietly(filePath) {
    if (!filePath) return;
    try {
      await this.deleteFile(filePath);
    } catch (error) {
      logger.warn(`Failed to delete previous file: ${filePath}`, { message: error.message });
    }
  }
}

export default new FileService();
