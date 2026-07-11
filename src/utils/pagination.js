import { PAGINATION } from '../config/constants.js';

export const getPaginationParams = (query) => {
  const page = parseInt(query.page) || PAGINATION.DEFAULT_PAGE;
  const limit = parseInt(query.limit) || PAGINATION.DEFAULT_LIMIT;
  const offset = (page - 1) * limit;

  return {
    page: Math.max(page, 1),
    limit: Math.min(Math.max(limit, 1), PAGINATION.MAX_LIMIT),
    offset
  };
};

export const getPaginationMeta = (total, page, limit) => {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
};

export const paginateArray = (array, page, limit) => {
  const offset = (page - 1) * limit;
  return array.slice(offset, offset + limit);
};
