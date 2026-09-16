import fs from 'fs';
import path from 'path';

const dataDir = path.resolve(process.cwd(), '.data');

export const readStore = (name) => {
  try {
    const parsed = JSON.parse(fs.readFileSync(path.join(dataDir, `${name}.json`), 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const writeStore = (name, rows) => {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, `${name}.json`), JSON.stringify(rows, null, 2));
};
