const router = require('express').Router();
const db   = require('../db');
const auth = require('../middleware/auth');
const isAdmin = (req,res,next) => req.user?.role==='admin' ? next() : res.status(403).json({ error:'Admin only' });

router.get('/stats',    auth, isAdmin, (req,res) => res.json({ users:db.getUserCount(), paid:db.getPaidUserCount(), docs:db.getTotalDocuments(), ...db.getRevenue() }));
router.get('/users',    auth, isAdmin, (req,res) => res.json({ users:db.getAllUsers() }));
router.delete('/users/:id', auth, isAdmin, (req,res) => { db.deleteUser(req.params.id); res.json({ ok:true }); });
router.get('/payments', auth, isAdmin, (req,res) => res.json({ payments:db.getAllPayments() }));
router.get('/revenue',  auth, isAdmin, (req,res) => res.json(db.getRevenue()));

// Make a user admin (run once to set yourself up)
router.post('/make-admin', auth, (req,res) => {
  db.updateUser(req.user.id, { role:'admin' });
  res.json({ ok:true, message:`${req.user.email} is now admin` });
});

module.exports = router;
