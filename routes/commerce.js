const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
router.use(requireAuth);

// GET /api/orders  ?status=&type=&q=
router.get('/', (req, res) => {
  const { status, type, q, limit = 50, offset = 0 } = req.query;
  let sql = `SELECT o.*, p.first_name||" "||p.last_name as player_name, p.avatar as player_avatar FROM orders o LEFT JOIN players p ON o.player_id=p.id WHERE 1=1`;
  const params = [];
  if (status) { sql += ' AND o.status=?'; params.push(status); }
  if (type)   { sql += ' AND o.order_type=?'; params.push(type); }
  if (q)      { sql += ' AND (o.family_name LIKE ? OR o.description LIKE ? OR o.order_number LIKE ?)'; params.push(`%${q}%`,`%${q}%`,`%${q}%`); }
  sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));
  const rows = db.prepare(sql).all(...params);
  const total = db.prepare(`SELECT COUNT(*) as c FROM orders WHERE 1=1${status?' AND status=?':''}${type?' AND order_type=?':''}`).get(...(status?[status]:[]),...(type?[type]:[])).c;
  res.json({ orders: rows, total });
});

// POST /api/orders  — record payment / new order
router.post('/', (req, res) => {
  const { player_id, family_name, description, amount, order_type, status, payment_method, receipt_sent } = req.body;
  if (!description || !amount) return res.status(400).json({ error: 'description and amount required' });
  const num = '#' + (10000 + Math.floor(Math.random() * 90000));
  const paid_at = status === 'paid' ? new Date().toISOString() : null;
  const r = db.prepare(`INSERT INTO orders (order_number,player_id,family_name,description,amount,order_type,status,payment_method,receipt_sent,paid_at) VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(num, player_id||null, family_name||null, description, Number(amount), order_type||'dues', status||'pending', payment_method||null, receipt_sent?1:0, paid_at);
  res.status(201).json({ id: r.lastInsertRowid, order_number: num });
});

// PUT /api/orders/:id  — update status / record payment
router.put('/:id', (req, res) => {
  const { status, payment_method } = req.body;
  const paid_at = status === 'paid' ? new Date().toISOString() : null;
  db.prepare('UPDATE orders SET status=COALESCE(?,status),payment_method=COALESCE(?,payment_method),paid_at=COALESCE(?,paid_at) WHERE id=?')
    .run(status||null, payment_method||null, paid_at, req.params.id);
  res.json({ ok: true });
});

// GET /api/orders/stats/summary
router.get('/stats/summary', (req, res) => {
  const revenue   = db.prepare("SELECT COALESCE(SUM(amount),0) as s FROM orders WHERE status='paid'").get().s;
  const total     = db.prepare('SELECT COUNT(*) as c FROM orders').get().c;
  const pending   = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status='pending'").get().c;
  const overdue   = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status='overdue'").get().c;
  const overdueAmt= db.prepare("SELECT COALESCE(SUM(amount),0) as s FROM orders WHERE status='overdue'").get().s;
  res.json({ revenue, total, pending, overdue, overdue_amount: overdueAmt });
});

// POST /api/orders/:id/remind
router.post('/:id/remind', (req, res) => {
  // In production: send email via SendGrid/Resend. Here: just mark attempted.
  const order = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ ok: true, message: `Reminder queued for ${order.family_name}` });
});

module.exports = router;
