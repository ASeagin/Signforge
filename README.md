# 🚀 SignForge – Complete Setup & Business Guide

---

## ⚡ QUICK START (Get running in 5 minutes)

### Step 1 — Install Node.js
Go to https://nodejs.org → click the green "LTS" button → install it.

### Step 2 — Extract this ZIP and open in VS Code

### Step 3 — Open terminal in VS Code (View → Terminal or Ctrl+`)

### Step 4 — Install and run
```
npm install
npm start
```

### Step 5 — Open browser
Go to: **http://localhost:3000**

Your full app is live! ✅

---

## 📁 FILE STRUCTURE

```
signforge/
├── server.js              ← Main server (start here)
├── db.js                  ← Database (in-memory, works instantly)
├── package.json           ← Dependencies
├── .env                   ← Your secret keys (NEVER share this)
├── emails/
│   └── mailer.js          ← Email templates (welcome, payment, etc.)
├── middleware/
│   └── auth.js            ← Login protection
├── routes/
│   ├── auth.js            ← Register, login, logout, password reset
│   ├── user.js            ← Profile, documents, AI placement
│   ├── billing.js         ← Stripe payments, webhooks
│   └── admin.js           ← Admin panel
└── public/
    └── index.html         ← Complete frontend (all pages)
```

---

## 🌐 PAGES IN THE APP

| Page | URL | Description |
|------|-----|-------------|
| Home | / | Landing page with hero, features, pricing |
| Features | /features | Full feature breakdown |
| Pricing | /pricing | 3 pricing plans |
| How it works | /how | Step-by-step guide |
| Login | /login | Email + password login |
| Register | /signup | Create account (gets welcome email) |
| Dashboard | /dashboard | Stats, recent documents |
| Sign Document | /sign | Upload PDF, capture sig, AI placement, download |
| Billing | /billing | Subscription management |
| Profile | /profile | Name, password, saved signature |
| Checkout | /checkout | Payment page with card form |
| Contact | /contact | Contact form |
| Terms | /terms | Terms of service |
| Privacy | /privacy | Privacy policy |

---

## 💰 HOW YOU RECEIVE PAYMENTS

### The money flow:
1. User enters card details on your Stripe checkout page
2. Stripe processes the payment securely (they handle all card security)
3. Stripe takes their fee: **2.9% + $0.30 per transaction**
   - On $1.99: you keep ~$1.63
   - On $4.99: you keep ~$4.55
4. Money collects in your Stripe balance
5. Stripe automatically pays out to your bank account every **2 business days**

### Accounts you must create:
1. **Stripe** (stripe.com) — FREE to create. Add your bank account in the dashboard.
2. **Resend** (resend.com) — FREE up to 3,000 emails/month
3. **Render or Railway** (for hosting) — FREE tier available
4. **Namecheap** (namecheap.com) — ~$12/year for your domain

---

## 🔑 STRIPE SETUP (Step by Step)

### 1. Create Stripe account
- Go to https://stripe.com
- Sign up with your email
- Add your bank account: Dashboard → Settings → Payouts

### 2. Get your API keys
- Go to https://dashboard.stripe.com/apikeys
- Copy **Publishable key** (starts with pk_test_)
- Copy **Secret key** (starts with sk_test_)
- Add both to your `.env` file

### 3. Create your products
- Go to https://dashboard.stripe.com/products
- Click **+ Add product**
- Create **Starter**: $1.99/month (recurring)
  - Copy the Price ID (starts with price_xxx)
- Create **Pro**: $4.99/month (recurring)
  - Copy the Price ID

### 4. Add to .env
```
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
STRIPE_PRICE_STARTER=price_YOUR_STARTER_ID
STRIPE_PRICE_PRO=price_YOUR_PRO_ID
```

### 5. Set up webhook (to detect payments automatically)
- Go to https://dashboard.stripe.com/webhooks
- Click **Add endpoint**
- URL: `https://yourdomain.com/api/billing/webhook`
- Events to listen for: `checkout.session.completed`, `customer.subscription.deleted`
- Copy the **Signing secret** → add to `.env` as `STRIPE_WEBHOOK_SECRET`

### Going live (real money):
- In Stripe dashboard, click **Activate account**
- Complete identity verification
- Switch from test keys to live keys in your `.env`

---

## 📧 EMAIL SETUP (Resend)

### 1. Create Resend account
- Go to https://resend.com → sign up free
- Free tier: **3,000 emails/month** (enough for early stage)

### 2. Get API key
- Dashboard → API Keys → Create API Key
- Add to `.env`: `RESEND_API_KEY=re_YOUR_KEY`

### 3. Add your domain (for professional emails)
- Dashboard → Domains → Add Domain
- Add DNS records to your domain (Namecheap makes this easy)
- Update `.env`: `EMAIL_FROM=noreply@yourdomain.com`

### Emails that are sent automatically:
- ✅ Welcome email (after signup, with verification link)
- ✅ Payment confirmation (after successful payment)
- ✅ Trial used notification (after free trial is used)
- ✅ Password reset link

---

## 🤖 AI SIGNATURE PLACEMENT

Currently uses **smart rule-based placement** (no API cost!):

| You type | Where signature goes |
|----------|---------------------|
| "bottom right" | Bottom right corner |
| "bottom left" | Bottom left corner |
| "above my name" | Above the signature line |
| "next to the date" | Next to date field |
| "center" | Center of page |
| "top right" | Top right corner |

### To upgrade to real AI (optional, ~$0.01/request):
1. Get OpenAI API key from https://platform.openai.com
2. Add `OPENAI_API_KEY=sk-YOUR_KEY` to `.env`
3. In `routes/user.js`, replace the rule-based logic with:
```javascript
const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: `A PDF is ${pageWidth}x${pageHeight}px. Where should a signature go if the instruction is: "${instruction}"? Reply with JSON: {x, y, width, height}` }]
});
// Parse response and return coordinates
```

---

## 🌐 DEPLOYMENT (Put it online FREE)

### Option 1: Render (Recommended — FREE tier)

1. Create account at https://render.com
2. Push your code to GitHub:
   ```
   git init
   git add .
   git commit -m "Initial SignForge build"
   git push
   ```
3. In Render: **New → Web Service**
4. Connect your GitHub repo
5. Settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
6. Environment Variables: Add all your `.env` values
7. Click **Deploy**!

Your app will be live at: `https://signforge.onrender.com`

### Option 2: Railway (Also FREE to start)
1. Go to https://railway.app
2. Connect GitHub
3. Deploy → add env vars → done

---

## 🌍 DOMAIN NAME

### Buy your domain (~$12/year):
1. Go to https://www.namecheap.com
2. Search for `signforge.com` or `signforge.app`
3. Purchase it

### Connect to Render:
1. Render → Your Service → Settings → Custom Domains
2. Add your domain
3. Copy the CNAME record
4. In Namecheap → Domain → Advanced DNS → Add the record
5. Wait 24 hours for DNS to propagate

---

## 💵 MONTHLY COSTS BREAKDOWN

| Service | Free Tier | Paid |
|---------|-----------|------|
| Render hosting | FREE (with limitations) | $7/month |
| Resend emails | FREE (3K emails) | $20/month |
| Domain name | — | ~$1/month |
| Stripe | FREE (pay per transaction) | 2.9% + $0.30/charge |
| **TOTAL to start** | **$0** | **~$8–28/month** |

### Revenue projections:
- 100 Pro subscribers = **$499/month** → you keep ~$454
- 500 Pro subscribers = **$2,495/month** → you keep ~$2,270
- 1000 Pro subscribers = **$4,990/month** → you keep ~$4,540

---

## 📣 ADVERTISING STRATEGY

### TikTok (Highest ROI for this product)
**Video ideas that go viral:**
- "I used to spend 20 min printing, signing, scanning. Now I do it in 30 seconds."
- Screen recording showing someone upload a contract and sign it in real-time
- "The app lawyers don't want you to know about"
- Before/after: messy printer setup vs. clean digital signing

**Target audiences:** Freelancers, real estate agents, lawyers, small business owners

### Instagram Reels
- Same content as TikTok, repurposed
- Post 3x/week minimum
- Use hashtags: #freelancer #smallbusiness #productivity #digitalsignature

### Google SEO (Free, long-term)
Write blog posts targeting:
- "how to sign a PDF without printing"
- "free online PDF signing tool"
- "electronic signature app"
- "sign PDF with phone camera"

### Google Ads (Paid, fast results)
- Budget: $5–10/day to start
- Keywords: "sign pdf online", "electronic signature", "pdf signing tool"
- Estimated cost per click: $1–3

### Reddit
- Post in r/freelance, r/productivity, r/smallbusiness
- Be helpful, not spammy

### ProductHunt Launch
- Launch on https://producthunt.com
- Can get thousands of visitors in one day

---

## 🔑 API ENDPOINTS

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Login |
| POST | /api/auth/logout | Logout |
| GET | /api/auth/me | Get current user |
| GET | /api/auth/verify?token=X | Verify email |
| POST | /api/auth/forgot-password | Request reset |
| POST | /api/auth/reset-password | Set new password |
| GET | /api/user/stats | Dashboard stats |
| GET | /api/user/documents | Document history |
| POST | /api/user/documents | Log signed document |
| POST | /api/user/signature | Save signature |
| GET | /api/user/signature | Get saved signature |
| PUT | /api/user/profile | Update profile |
| POST | /api/user/ai-place | AI signature placement |
| GET | /api/billing/subscription | Get plan info |
| POST | /api/billing/create-checkout | Start Stripe checkout |
| POST | /api/billing/webhook | Stripe events |
| POST | /api/billing/cancel | Cancel subscription |
| POST | /api/billing/demo-upgrade | Demo mode upgrade |
| GET | /api/admin/stats | Admin overview |
| GET | /api/admin/users | All users |
| GET | /api/admin/payments | All payments |
| POST | /api/admin/make-admin | Make yourself admin |

---

## ⚖️ LEGAL CONSIDERATIONS

### Before launching:
1. **Terms of Service** — already included in the app at /terms
2. **Privacy Policy** — already included at /privacy
3. **GDPR compliance** — files deleted in 24 hours (already implemented)
4. **Electronic signature validity** — varies by country/contract type. Add a disclaimer that users should consult a lawyer for legally binding contracts.

### Accounts to register:
- Business bank account (recommended)
- Stripe account (verified with ID)
- Optional: Register as a business entity in your country

---

## 🗄️ UPGRADING TO POSTGRESQL (For production scale)

Currently using in-memory storage (perfect for development and early launch).
When you have 100+ users, upgrade to PostgreSQL:

1. **Create free database** at https://supabase.com
2. Install: `npm install pg`
3. Replace `db.js` with PostgreSQL queries
4. Connection string goes in `.env`:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/signforge
   ```

### PostgreSQL tables to create:
```sql
CREATE TABLE users (id UUID PRIMARY KEY, name TEXT, email TEXT UNIQUE, password_hash TEXT, plan TEXT DEFAULT 'free', trial_used BOOLEAN DEFAULT false, stripe_customer_id TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE documents (id UUID PRIMARY KEY, user_id UUID REFERENCES users(id), filename TEXT, status TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE signatures (id UUID PRIMARY KEY, user_id UUID REFERENCES users(id) UNIQUE, data_url TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE payments (id UUID PRIMARY KEY, user_id UUID, amount INTEGER, status TEXT, stripe_id TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
```

---

## 🆘 TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| `npm start` fails | Run `npm install` first |
| Port already in use | Change PORT in .env to 3001 |
| Payments not working | Add real Stripe keys to .env |
| Emails not sending | Add RESEND_API_KEY to .env |
| Camera not working | Browser needs HTTPS or localhost |
| PDF won't load | Check file is under 20MB |

---

## 🎯 LAUNCH CHECKLIST

- [ ] `npm install` and `npm start` works
- [ ] Register an account and verify it works
- [ ] Sign a test document (free trial)
- [ ] Create Stripe account and add keys to .env
- [ ] Create products in Stripe dashboard ($1.99 + $4.99)
- [ ] Test payment in demo mode, then test with Stripe test card
- [ ] Create Resend account and add API key
- [ ] Test welcome email is received
- [ ] Deploy to Render or Railway
- [ ] Buy domain name
- [ ] Connect domain to hosting
- [ ] Switch to Stripe live keys
- [ ] Launch! 🚀

---

*SignForge — Built to scale to thousands of users* 🚀
