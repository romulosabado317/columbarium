const handler = require('./handler.cjs');

module.exports = async function (req, res) {
  return handler(req, res);
};
