import { ERROR_CODES, HTTP_STATUS } from '../config/constants.js';

export class AppError extends Error {
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, code = ERROR_CODES.INTERNAL_ERROR, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
  }
}

export const notFound = (entity = 'Resource') =>
  new AppError(`${entity} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);

export const conflict = (message) =>
  new AppError(message, HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT_ERROR);

export const unauthorized = (message = 'Invalid credentials') =>
  new AppError(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_ERROR);

export const forbidden = (message = 'Insufficient permissions') =>
  new AppError(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);

export const badRequest = (message, errors = null) =>
  new AppError(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, errors);
