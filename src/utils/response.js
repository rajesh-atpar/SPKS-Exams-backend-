export const successResponse = (res, message, data = null, statusCode = 200, meta = null) => {
  const body = {
    success: true,
    message,
    data
  };

  if (meta) {
    body.meta = meta;
  }

  return res.status(statusCode).json(body);
};

export const errorResponse = (res, message, statusCode = 500, errors = null, code = null) => {
  const body = {
    success: false,
    message
  };

  if (errors) {
    body.errors = errors;
  }

  if (code) {
    body.code = code;
  }

  return res.status(statusCode).json(body);
};

export const paginatedResponse = (res, message, data, { page, limit, total }) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0
    }
  });
};
