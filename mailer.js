const nodemailer = require('nodemailer');
const APP = process.env.APP_NAME || 'SignForge';
const FROM = `${APP} <${process.env.EMAIL_FROM || 'noreply@signforge.app'}>`;
const URL  = process.env.APP_URL || 'http://localhost:3000';

function transport() {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('REPLACE')) return null;
  return nodemailer.createTransport({ host:'smtp.resend.com', port:465, secure:true, auth:{ user:'resend', pass:process.env.RESEND_API_KEY } });
}
async function send({ to, subject, html }) {
  const t = transport();
  if (!t) { console.log(`\n📧 EMAIL → ${to} | ${subject} (add RESEND_API_KEY to send real emails)\n`); return; }
  await t.sendMail({ from: FROM, to, subject, html });
}

const wrap = (body) => `<div style="font-family:sans-serif;background:#07090f;color:#e2e8f8;max-width:600px;margin:0 auto;border-radius:16px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#635bff,#06d6a0);padding:36px;text-align:center"><h1 style="color:#fff;margin:0;font-size:1.8rem">SignForge</h1></div>
  <div style="padding:36px">${body}</div>
  <div style="padding:20px 36px;border-top:1px solid rgba(255,255,255,.07);font-size:.8rem;color:rgba(226,232,248,.3)">© ${new Date().getFullYear()} SignForge. All rights reserved.</div>
</div>`;

exports.sendWelcome = ({ name, email, verifyToken }) => send({ to: email, subject: `Welcome to SignForge, ${name}! 🎉`, html: wrap(`
  <h2 style="color:#f0f4ff">Welcome, ${name}! 🎉</h2>
  <p style="color:rgba(226,232,248,.7);line-height:1.7">Your account is ready. You have <strong style="color:#06d6a0">1 free document signing</strong> to try — no payment needed.</p>
  <div style="background:rgba(99,91,255,.12);border:1px solid rgba(99,91,255,.3);border-radius:12px;padding:20px;margin:20px 0">
    <strong style="color:#a78bfa">How it works:</strong><br/><br/>
    <span style="color:rgba(226,232,248,.7);line-height:2">📄 Upload your PDF → 📷 Capture your signature → 🤖 AI places it → ⬇️ Download signed PDF</span>
  </div>
  <a href="${URL}/verify?token=${verifyToken}" style="display:inline-block;background:linear-gradient(135deg,#635bff,#4f46e5);color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600">Verify Email & Start →</a>
`) });

exports.sendPaymentConfirm = ({ name, email, plan, amount }) => send({ to: email, subject: `Payment confirmed — Welcome to ${plan} Plan! ✅`, html: wrap(`
  <h2 style="color:#06d6a0">Payment Confirmed! ✅</h2>
  <p style="color:rgba(226,232,248,.7)">Hi ${name}, your payment of <strong>$${(amount/100).toFixed(2)}/month</strong> was successful.</p>
  <p style="color:rgba(226,232,248,.7)">You now have <strong style="color:#a78bfa">${plan==='pro'?'unlimited':'10'} document signings per month</strong>.</p>
  <a href="${URL}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#06d6a0,#059669);color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;margin-top:16px">Go to Dashboard →</a>
`) });

exports.sendTrialUsed = ({ name, email }) => send({ to: email, subject: 'Your free trial is used — upgrade to keep signing', html: wrap(`
  <h2 style="color:#f0f4ff">Your free trial has been used ✍️</h2>
  <p style="color:rgba(226,232,248,.7)">Hi ${name}, you've used your 1 free document signing. Upgrade to continue!</p>
  <div style="background:rgba(99,91,255,.1);border-radius:12px;padding:20px;margin:20px 0">
    <p style="color:#a78bfa;font-weight:700;margin:0 0 6px">Starter — $1.99/month · 10 documents</p>
    <p style="color:#06d6a0;font-weight:700;margin:0">Pro — $4.99/month · Unlimited</p>
  </div>
  <a href="${URL}/billing" style="display:inline-block;background:linear-gradient(135deg,#635bff,#4f46e5);color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600">Upgrade Now →</a>
`) });

exports.sendPasswordReset = ({ email, token }) => send({ to: email, subject: 'Reset your SignForge password', html: wrap(`
  <h2 style="color:#f0f4ff">Reset your password</h2>
  <p style="color:rgba(226,232,248,.7)">Click below to reset your password. Link expires in 1 hour.</p>
  <a href="${URL}/reset-password?token=${token}" style="display:inline-block;background:linear-gradient(135deg,#635bff,#4f46e5);color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;margin-top:16px">Reset Password →</a>
`) });
