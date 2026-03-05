const router  = require('express').Router();
const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY||'sk_test_placeholder');
const db      = require('../db');
const mailer  = require('../emails/mailer');
const auth    = require('../middleware/auth');

const DEMO = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('REPLACE');

router.get('/subscription', auth, (req,res) => {
  const { plan, stripeSubscriptionId } = req.user;
  res.json({ subscription:{ plan, status: plan==='free'?'none':'active', stripeSubscriptionId }});
});

// ── CREATE CHECKOUT SESSION ────────────────────────
// Stripe Checkout = Stripe hosts the payment page for you
// Handles cards, Apple Pay, Google Pay automatically
// You receive money in your Stripe dashboard → Payouts → your bank
router.post('/create-checkout', auth, async (req,res) => {
  try {
    const { plan } = req.body;
    const priceId  = plan==='starter' ? process.env.STRIPE_PRICE_STARTER : process.env.STRIPE_PRICE_PRO;

    if (DEMO || !priceId || priceId.includes('REPLACE')) {
      // DEMO MODE — simulate payment without real Stripe
      return res.json({ demoMode:true, plan });
    }

    let customerId = req.user.stripeCustomerId;
    if (!customerId) {
      const c = await stripe.customers.create({ email:req.user.email, name:req.user.name, metadata:{ userId:req.user.id }});
      customerId = c.id;
      db.updateUser(req.user.id, { stripeCustomerId:customerId });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price:priceId, quantity:1 }],
      success_url: `${process.env.APP_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.APP_URL}/billing`,
      allow_promotion_codes: true,
      subscription_data: { trial_period_days:7, metadata:{ userId:req.user.id, plan } },
    });

    res.json({ url:session.url });
  } catch(e) { console.error('Stripe error:',e.message); res.status(500).json({ error:'Could not create checkout' }); }
});

// ── STRIPE WEBHOOK ─────────────────────────────────
// Stripe calls this URL automatically when:
// - Payment succeeds
// - Subscription is cancelled
// - Payment fails
// Set webhook URL in Stripe dashboard: https://dashboard.stripe.com/webhooks
router.post('/webhook', (req,res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch(e) { return res.status(400).json({ error:'Webhook signature failed' }); }

  if (event.type === 'checkout.session.completed') {
    const s   = event.data.object;
    const uid = s.subscription_data?.metadata?.userId || s.metadata?.userId;
    const plan= s.subscription_data?.metadata?.plan || 'pro';
    if (uid) {
      db.updateUser(uid, { plan, stripeSubscriptionId:s.subscription });
      const user = db.findUserById(uid);
      const amount = plan==='starter' ? 199 : 499;
      db.recordPayment({ userId:uid, userEmail:user?.email, amount, status:'succeeded', stripeId:s.id, plan });
      if (user) mailer.sendPaymentConfirm({ name:user.name, email:user.email, plan, amount }).catch(()=>{});
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const all = db.getAllUsers();
    const u   = all.find(u => u.stripeCustomerId === sub.customer);
    if (u) db.updateUser(u.id, { plan:'free', stripeSubscriptionId:null });
  }

  res.json({ received:true });
});

router.post('/cancel', auth, async (req,res) => {
  try {
    if (req.user.stripeSubscriptionId && !DEMO)
      await stripe.subscriptions.update(req.user.stripeSubscriptionId, { cancel_at_period_end:true });
    res.json({ ok:true });
  } catch(e) { res.status(500).json({ error:'Could not cancel' }); }
});

// Demo mode: simulate a successful payment
router.post('/demo-upgrade', auth, (req,res) => {
  const { plan } = req.body;
  const amount = plan==='starter'?199:499;
  db.updateUser(req.user.id, { plan });
  db.recordPayment({ userId:req.user.id, userEmail:req.user.email, amount, status:'succeeded', stripeId:'demo_'+Date.now(), plan });
  mailer.sendPaymentConfirm({ name:req.user.name, email:req.user.email, plan, amount }).catch(()=>{});
  res.json({ ok:true, plan });
});

module.exports = router;
