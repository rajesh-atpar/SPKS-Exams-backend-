export const successResponse = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

export const errorResponse = (res, message, data = null, statusCode = 500, code = null) => {
  const response = {
    success: false,
    message,
    data
  };

  if (code) {
    response.code = code;
  }

  return res.status(statusCode).json(response);
};

export const paginatedResponse = (res, message, data, pagination) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination
  });
};
