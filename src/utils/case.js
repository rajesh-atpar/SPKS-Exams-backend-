const toCamelKey = (key) => key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
const toSnakeKey = (key) => key.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);

export const toCamel = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => toCamel(item));
  }

  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [toCamelKey(key), toCamel(nested)])
    );
  }

  return value;
};

export const toSnake = (value) => {
  if (!value || typeof value !== 'object' || value instanceof Date || Array.isArray(value)) {
    return value;
  }

  const result = {};
  for (const [key, nested] of Object.entries(value)) {
    if (nested !== undefined) {
      result[toSnakeKey(key)] = nested;
    }
  }
  return result;
};

export const omit = (object, keys) => {
  const result = { ...object };
  keys.forEach((key) => {
    delete result[key];
  });
  return result;
};
