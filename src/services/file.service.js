import { Readable } from 'stream';
import { supabaseAdmin } from '../services/supabaseClient.js';
import { FILE_UPLOAD, ERROR_CODES, HTTP_STATUS } from '../config/constants.js';
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

const errorText = (error) => String(error?.message || error?.error || error?.statusCode || '');

export class FileService {
  constructor() {
    this.bucket = FILE_UPLOAD.BUCKET;
    this.bucketReady = false;
  }

  fail(message, statusCode = HTTP_STATUS.BAD_REQUEST) {
    const err = new Error(message);
    err.code = ERROR_CODES.INTERNAL_ERROR;
    err.statusCode = statusCode;
    return err;
  }

  friendly(error) {
    const text = errorText(error);
    if (/bucket not found|resource was not found/i.test(text)) {
      return `Storage bucket "${this.bucket}" is missing. In Supabase go to Storage and create a public bucket named "${this.bucket}", or run database/migrations/2026-09-19-uploads-bucket.sql.`;
    }
    if (/unauthorized|not allowed|row-level security|permission|jwt|invalid api key/i.test(text)) {
      return 'Storage upload is not authorized. Set SUPABASE_SERVICE_ROLE_KEY to the service_role key (not the anon key).';
    }
    if (/payload|too large|maximum|exceeded/i.test(text)) {
      return `PDF is too large. Maximum size is ${Math.round(FILE_UPLOAD.MAX_SIZE / 1024 / 1024)}MB.`;
    }
    if (/mime|content type|not supported/i.test(text)) {
      return 'This file type is not allowed. Upload a PDF.';
    }
    return text ? `File upload failed: ${text}` : 'File upload failed';
  }

  safeObjectName(originalname) {
    const original = String(originalname || 'document.pdf');
    const extMatch = original.toLowerCase().match(/\.[a-z0-9]{1,8}$/);
    const ext = extMatch ? extMatch[0] : '.pdf';
    const base = original
      .slice(0, original.length - ext.length)
      .normalize('NFKD')
      .replace(/[^\w.-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 60) || 'file';
    return `${Date.now()}-${base}${ext}`;
  }

  async ensureBucket(force = false) {
    if (this.bucketReady && !force) return;

    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    if (listError) {
      logger.error('Storage listBuckets error:', listError);
      return;
    }

    const exists = (buckets || []).some((bucket) => bucket.id === this.bucket || bucket.name === this.bucket);
    if (!exists) {
      const { error: createError } = await supabaseAdmin.storage.createBucket(this.bucket, {
        public: true,
        fileSizeLimit: FILE_UPLOAD.MAX_SIZE,
        allowedMimeTypes: [...FILE_UPLOAD.ALLOWED_IMAGE_TYPES, ...FILE_UPLOAD.ALLOWED_DOCUMENT_TYPES]
      });
      if (createError && !/exists|duplicate/i.test(errorText(createError))) {
        logger.error('Storage createBucket error:', createError);
        throw this.fail(this.friendly(createError));
      }
      logger.info(`Created storage bucket: ${this.bucket}`);
    } else {
      await supabaseAdmin.storage.updateBucket(this.bucket, { public: true }).catch(() => {});
    }

    this.bucketReady = true;
  }

  async uploadFile(file, path) {
    if (!file?.buffer?.length) {
      throw this.fail('PDF file is missing or empty');
    }

    await this.ensureBucket();

    const folder = String(path || FILE_UPLOAD.CONTENT_PATH).replace(/^\/+|\/+$/g, '');
    const filePath = `${folder}/${this.safeObjectName(file.originalname)}`;
    const body = Buffer.isBuffer(file.buffer) ? file.buffer : Buffer.from(file.buffer);
    const options = {
      contentType: file.mimetype || 'application/pdf',
      cacheControl: '3600',
      upsert: true
    };

    let { error } = await supabaseAdmin.storage.from(this.bucket).upload(filePath, body, options);

    if (error && /bucket not found/i.test(errorText(error))) {
      this.bucketReady = false;
      await this.ensureBucket(true);
      ({ error } = await supabaseAdmin.storage.from(this.bucket).upload(filePath, body, options));
    }

    if (error) {
      logger.error('File upload error:', error);
      throw this.fail(this.friendly(error));
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(this.bucket)
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
      .from(this.bucket)
      .remove([filePath]);

    if (error) {
      logger.error('File deletion error:', error);
      throw this.fail('File deletion failed', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    logger.info(`File deleted: ${filePath}`);
    return { message: 'File deleted successfully' };
  }

  async getFileUrl(filePath) {
    const { data, error } = supabaseAdmin.storage
      .from(this.bucket)
      .getPublicUrl(filePath);

    if (error) {
      throw pdfNotFound();
    }

    return data.publicUrl;
  }

  extractUploadsPath(url) {
    if (!url || typeof url !== 'string') return null;
    try {
      const parsed = new URL(url);
      const markers = [
        `/storage/v1/object/public/${this.bucket}/`,
        `/storage/v1/object/sign/${this.bucket}/`
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
        .from(this.bucket)
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
