const { v4: uuid } = require('uuid');
const users = new Map(), sessions = new Map(), documents = new Map();
const signatures = new Map(), payments = [], resetTokens = new Map(), verifyTokens = new Map();

module.exports = {
  createUser({ name, email, passwordHash }) {
    const id = uuid(), vt = uuid();
    const user = { id, name, email, passwordHash, plan: 'free', role: 'user',
      trialUsed: false, emailVerified: false, stripeCustomerId: null,
      stripeSubscriptionId: null, createdAt: new Date().toISOString() };
    users.set(id, user);
    verifyTokens.set(vt, { userId: id, createdAt: Date.now() });
    return { user, verifyToken: vt };
  },
  verifyEmail(token) {
    const e = verifyTokens.get(token); if (!e) return false;
    const u = users.get(e.userId); if (!u) return false;
    u.emailVerified = true; verifyTokens.delete(token); return true;
  },
  findUserByEmail(email) { for (const u of users.values()) if (u.email.toLowerCase()===email.toLowerCase()) return u; return null; },
  findUserById(id) { return users.get(id)||null; },
  updateUser(id, updates) { const u=users.get(id); if(!u) return null; Object.assign(u,updates); return u; },
  getAllUsers() { return Array.from(users.values()).map(u=>({...u,passwordHash:undefined})); },
  deleteUser(id) { users.delete(id); },
  getUserCount() { return users.size; },
  getPaidUserCount() { return Array.from(users.values()).filter(u=>u.plan!=='free').length; },
  createSession(userId) { const t=uuid()+uuid(); sessions.set(t,{userId,createdAt:Date.now()}); return t; },
  getSession(t) { return sessions.get(t)||null; },
  deleteSession(t) { sessions.delete(t); },
  createResetToken(userId) { const t=uuid(); resetTokens.set(t,{userId,createdAt:Date.now()}); setTimeout(()=>resetTokens.delete(t),3600000); return t; },
  getResetToken(t) { return resetTokens.get(t)||null; },
  deleteResetToken(t) { resetTokens.delete(t); },
  createDocument({ userId, filename, originalName }) {
    const id=uuid(), doc={id,userId,filename,originalName,status:'signed',createdAt:new Date().toISOString()};
    documents.set(id,doc); return doc;
  },
  getUserDocuments(userId) { return Array.from(documents.values()).filter(d=>d.userId===userId).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)); },
  countUserDocuments(userId) { return Array.from(documents.values()).filter(d=>d.userId===userId).length; },
  getTotalDocuments() { return documents.size; },
  saveSignature({ userId, dataURL }) { const id=uuid(); signatures.set(userId,{id,userId,dataURL,createdAt:new Date().toISOString()}); return id; },
  getSignature(userId) { return signatures.get(userId)||null; },
  recordPayment(p) { payments.push({id:uuid(),...p,createdAt:new Date().toISOString()}); },
  getAllPayments() { return [...payments].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)); },
  getRevenue() {
    const ok=payments.filter(p=>p.status==='succeeded');
    const total=ok.reduce((s,p)=>s+p.amount,0)/100;
    const now=new Date();
    const mrr=ok.filter(p=>new Date(p.createdAt).getMonth()===now.getMonth()).reduce((s,p)=>s+p.amount,0)/100;
    const monthly=[];
    for(let i=5;i>=0;i--){const d=new Date();d.setMonth(d.getMonth()-i);monthly.push({month:d.toLocaleString('en-US',{month:'short'}),amount:ok.filter(p=>{const pd=new Date(p.createdAt);return pd.getMonth()===d.getMonth()&&pd.getFullYear()===d.getFullYear();}).reduce((s,p)=>s+p.amount,0)/100});}
    return { total, mrr, monthly };
  },
};
