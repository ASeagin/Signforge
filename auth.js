const db = require('../db');
module.exports = function(req, res, next) {
  const token = req.cookies?.session || req.headers?.authorization?.replace('Bearer ','');
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  const session = db.getSession(token);
  if (!session) return res.status(401).json({ error: 'Session expired. Please log in again.' });
  const user = db.findUserById(session.userId);
  if (!user) return res.status(401).json({ error: 'User not found' });
  req.user = user; req.token = token; next();
};
