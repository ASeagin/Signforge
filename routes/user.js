const router = require('express').Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path   = require('path');
const db     = require('../db');
const mailer = require('../emails/mailer');
const auth   = require('../middleware/auth');

const upload = multer({ dest: path.join(__dirname,'../public/uploads'), limits:{ fileSize:20*1024*1024 } });

router.get('/stats', auth, (req,res) => {
  const total = db.countUserDocuments(req.user.id);
  const { plan, trialUsed } = req.user;
  const remaining = plan==='pro' ? '∞' : plan==='starter' ? Math.max(0,10-total) : trialUsed ? 0 : 1;
  res.json({ total, plan, remaining, trialUsed });
});

router.get('/documents', auth, (req,res) => res.json({ documents: db.getUserDocuments(req.user.id) }));

router.post('/documents', auth, (req,res) => {
  const { plan, trialUsed, id } = req.user;
  const count = db.countUserDocuments(id);
  if (plan==='free' && trialUsed) return res.status(403).json({ error:'trial_used', message:'Your free trial is used. Please upgrade to continue.' });
  if (plan==='starter' && count>=10) return res.status(403).json({ error:'limit_reached', message:'Starter plan limit reached. Upgrade to Pro for unlimited signing.' });
  if (plan==='free') { db.updateUser(id,{trialUsed:true}); mailer.sendTrialUsed({name:req.user.name,email:req.user.email}).catch(()=>{}); }
  const doc = db.createDocument({ userId:id, filename:req.body.filename||'document.pdf', originalName:req.body.originalName||'document.pdf' });
  res.json({ document:doc });
});

router.post('/signature', auth, (req,res) => {
  const { dataURL } = req.body;
  if (!dataURL) return res.status(400).json({ error:'No signature data' });
  const id = db.saveSignature({ userId:req.user.id, dataURL });
  res.json({ id });
});

router.get('/signature', auth, (req,res) => {
  const sig = db.getSignature(req.user.id);
  res.json({ signature: sig ? sig.dataURL : null });
});

router.put('/profile', auth, async (req,res) => {
  try {
    const updates = { name: req.body.name };
    if (req.body.password) {
      if (req.body.password.length<8) return res.status(400).json({ error:'Password must be 8+ characters' });
      updates.passwordHash = await bcrypt.hash(req.body.password,12);
    }
    const user = db.updateUser(req.user.id, updates);
    res.json({ user:{ id:user.id,name:user.name,email:user.email,plan:user.plan } });
  } catch(e) { res.status(500).json({ error:'Update failed' }); }
});

// AI placement logic — no API cost, smart rule-based detection
router.post('/ai-place', auth, (req,res) => {
  const { instruction, pageWidth, pageHeight } = req.body;
  const ins = (instruction||'').toLowerCase();

  // ── Smart placement rules ──────────────────────
  // These rules interpret natural language instructions
  // To add real AI: replace with OpenAI API call
  // openai.chat.completions.create({ model:'gpt-4', messages:[{role:'user',content:instruction}] })
  // Cost estimate: ~$0.01 per request with GPT-4o
  let x = 0.6, y = 0.85; // default: bottom right

  if (ins.includes('bottom') && ins.includes('left'))   { x=0.05; y=0.88; }
  else if (ins.includes('bottom') && ins.includes('right')) { x=0.60; y=0.88; }
  else if (ins.includes('bottom'))                       { x=0.30; y=0.88; }
  else if (ins.includes('top') && ins.includes('left'))  { x=0.05; y=0.05; }
  else if (ins.includes('top') && ins.includes('right')) { x=0.60; y=0.05; }
  else if (ins.includes('top'))                          { x=0.30; y=0.05; }
  else if (ins.includes('middle') || ins.includes('center')) { x=0.30; y=0.45; }
  else if (ins.includes('left'))                         { x=0.05; y=0.85; }
  else if (ins.includes('right'))                        { x=0.60; y=0.85; }
  else if (ins.includes('above') && ins.includes('name')){ x=0.10; y=0.78; }
  else if (ins.includes('below') && ins.includes('name')){ x=0.10; y=0.85; }
  else if (ins.includes('date') || ins.includes('beside date')){ x=0.50; y=0.88; }

  res.json({
    x: Math.round((x * (pageWidth||800))),
    y: Math.round((y * (pageHeight||1100))),
    width: 200, height: 60,
    confidence: 'high',
    message: `Signature placed ${instruction||'bottom right'}`
  });
});

module.exports = router;
