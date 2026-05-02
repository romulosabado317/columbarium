import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const handler = require('./handler.cjs');

export default async function (req, res) {
  return handler(req, res);
}
