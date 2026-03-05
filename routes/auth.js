const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const mailer = require('../emails/mailer');

const safe = u => ({ id:u.id,name:u.name,email:u.email,plan:u.plan,role:u.role,trialUsed:u.trialUsed,emailVerified:u.emailVerified,createdAt:u.createdAt });

router.post('/register', async (req,res) => {
  try {
    const { name, email, password } = req.body;
    if (!name||!email||!password) return res.status(400).json({ error:'All fields required' });
    if (password.length < 8) return res.status(400).json({ error:'Password must be at least 8 characters' });
    if (db.findUserByEmail(email)) return res.status(400).json({ error:'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 12);
    const { user, verifyToken } = db.createUser({ name, email, passwordHash });
    const token = db.createSession(user.id);
    res.cookie('session', token, { httpOnly:true, sameSite:'lax', maxAge:7*24*60*60*1000 });
    mailer.sendWelcome({ name, email, verifyToken }).catch(()=>{});
    res.json({ user: safe(user) });
  } catch(e) { console.error(e); res.status(500).json({ error:'Registration failed' }); }
});

router.post('/login', async (req,res) => {
  try {
    const { email, password } = req.body;
    const user = db.findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      return res.status(401).json({ error:'Invalid email or password' });
    const token = db.createSession(user.id);
    res.cookie('session', token, { httpOnly:true, sameSite:'lax', maxAge:7*24*60*60*1000 });
    res.json({ user: safe(user) });
  } catch(e) { res.status(500).json({ error:'Login failed' }); }
});

router.get('/me', require('../middleware/auth'), (req,res) => res.json(safe(req.user)));

router.post('/logout', require('../middleware/auth'), (req,res) => {
  db.deleteSession(req.token); res.clearCookie('session'); res.json({ ok:true });
});

router.get('/verify', (req,res) => {
  const ok = db.verifyEmail(req.query.token);
  res.redirect(ok ? '/dashboard?verified=1' : '/login?error=invalid_token');
});

router.post('/forgot-password', async (req,res) => {
  const user = db.findUserByEmail(req.body.email);
  if (user) {
    const token = db.createResetToken(user.id);
    mailer.sendPasswordReset({ email:user.email, token }).catch(()=>{});
  }
  res.json({ ok:true }); // always ok to prevent email enumeration
});

router.post('/reset-password', async (req,res) => {
  const { token, password } = req.body;
  if (!password || password.length < 8) return res.status(400).json({ error:'Password must be 8+ characters' });
  const entry = db.getResetToken(token);
  if (!entry) return res.status(400).json({ error:'Invalid or expired reset link' });
  const hash = await bcrypt.hash(password, 12);
  db.updateUser(entry.userId, { passwordHash: hash });
  db.deleteResetToken(token);
  res.json({ ok:true });
});

module.exports = router;
