require('dotenv').config();
const express      = require('express');
const cookieParser = require('cookie-parser');
const cors         = require('cors');
const path         = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// Stripe webhook needs raw body BEFORE express.json()
app.use('/api/billing/webhook', express.raw({ type:'application/json' }));

app.use(express.json({ limit:'10mb' }));
app.use(express.urlencoded({ extended:true }));
app.use(cookieParser());
app.use(cors({ origin:process.env.APP_URL||'http://localhost:3000', credentials:true }));
app.use(express.static(path.join(__dirname,'public')));

app.use('/api/auth',    require('./routes/auth'));
app.use('/api/user',    require('./routes/user'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/admin',   require('./routes/admin'));

app.get('/api/health', (_,res) => res.json({ status:'ok', time:new Date() }));

// All other routes → serve the SPA
app.get('*', (_,res) => res.sendFile(path.join(__dirname,'public','index.html')));

app.listen(PORT, () => {
  console.log(`\n🚀 SignForge running at http://localhost:${PORT}`);
  console.log(`   Press Ctrl+C to stop\n`);
});
