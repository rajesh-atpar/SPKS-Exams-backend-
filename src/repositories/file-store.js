import fs from 'fs';
import path from 'path';

const dataDir = path.resolve(process.cwd(), '.data');
const diskWritesEnabled = !process.env.VERCEL;

export const readStore = (name) => {
  if (!diskWritesEnabled) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(path.join(dataDir, `${name}.json`), 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const writeStore = (name, rows) => {
  if (!diskWritesEnabled) return;
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(path.join(dataDir, `${name}.json`), JSON.stringify(rows, null, 2));
  } catch (error) {
    if (['ENOENT', 'EACCES', 'EROFS', 'EPERM'].includes(error.code)) return;
    throw error;
  }
};
