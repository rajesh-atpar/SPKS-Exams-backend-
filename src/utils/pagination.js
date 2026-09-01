import { PAGINATION } from '../config/constants.js';

export const getPaginationParams = (query) => {
  const page = parseInt(query.page, 10) || PAGINATION.DEFAULT_PAGE;
  const limit = parseInt(query.limit, 10) || PAGINATION.DEFAULT_LIMIT;

  return {
    page: Math.max(page, 1),
    limit: Math.min(Math.max(limit, 1), PAGINATION.MAX_LIMIT),
    offset: (Math.max(page, 1) - 1) * Math.min(Math.max(limit, 1), PAGINATION.MAX_LIMIT)
  };
};

export const getPaginationMeta = (total, page, limit) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit) || 0
});
