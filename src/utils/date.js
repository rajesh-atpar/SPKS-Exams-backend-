export const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toISOString();
};

export const formatDateTime = (date) => {
  if (!date) return null;
  return new Date(date).toLocaleString();
};

export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const addHours = (date, hours) => {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
};

export const isDateInPast = (date) => {
  return new Date(date) < new Date();
};

export const isDateInFuture = (date) => {
  return new Date(date) > new Date();
};

export const getDaysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
