const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
router.use(requireAuth);

// GET /api/reports/dashboard  — all KPIs in one call
router.get('/dashboard', (req, res) => {
  const players      = db.prepare("SELECT COUNT(*) as c FROM players WHERE status='active'").get().c;
  const waitlist     = db.prepare("SELECT COUNT(*) as c FROM players WHERE status='waitlist'").get().c;
  const teams        = db.prepare("SELECT COUNT(*) as c FROM teams").get().c;
  const revenue      = db.prepare("SELECT COALESCE(SUM(amount),0) as s FROM orders WHERE status='paid'").get().s;
  const outstanding  = db.prepare("SELECT COALESCE(SUM(amount),0) as s FROM orders WHERE status IN ('pending','overdue')").get().s;
  const overdue_ct   = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status='overdue'").get().c;
  const events_week  = db.prepare("SELECT COUNT(*) as c FROM events WHERE date BETWEEN date('now') AND date('now','+6 days')").get().c;
  const forms_done   = db.prepare("SELECT COUNT(*) as c FROM compliance_docs WHERE status='complete'").get().c;
  const forms_total  = db.prepare("SELECT COUNT(*) as c FROM compliance_docs").get().c;
  const forms_pct    = forms_total > 0 ? Math.round((forms_done / forms_total) * 100) : 0;
  const low_stock    = db.prepare('SELECT COUNT(*) as c FROM inventory WHERE quantity <= low_stock_threshold').get().c;
  const announcements= db.prepare("SELECT COUNT(*) as c FROM announcements WHERE date(created_at) >= date('now','-7 days')").get().c;
  const unread_msgs  = db.prepare('SELECT COALESCE(SUM(unread_count),0) as c FROM conversations').get().c;

  res.json({
    players, waitlist, teams, revenue, outstanding,
    overdue_count: overdue_ct, events_week, forms_pct,
    low_stock, announcements_recent: announcements, unread_messages: unread_msgs
  });
});

// GET /api/reports/revenue  — revenue by month (last 6 months)
router.get('/revenue', (req, res) => {
  const rows = db.prepare(`
    SELECT strftime('%Y-%m',created_at) as month, SUM(amount) as total, COUNT(*) as count
    FROM orders WHERE status='paid' AND created_at >= date('now','-6 months')
    GROUP BY month ORDER BY month
  `).all();
  res.json(rows);
});

// GET /api/reports/registrations  — registrations per team
router.get('/registrations', (req, res) => {
  const rows = db.prepare(`
    SELECT t.name, COUNT(p.id) as active, SUM(CASE WHEN p.status='waitlist' THEN 1 ELSE 0 END) as waitlist
    FROM teams t LEFT JOIN players p ON p.team_id=t.id
    GROUP BY t.id ORDER BY t.name
  `).all();
  res.json(rows);
});

// GET /api/reports/compliance
router.get('/compliance', (req, res) => {
  const rows = db.prepare(`
    SELECT t.name as team,
      SUM(CASE WHEN cd.status='complete' THEN 1 ELSE 0 END) as complete,
      SUM(CASE WHEN cd.status='missing' THEN 1 ELSE 0 END) as missing
    FROM compliance_docs cd JOIN players p ON cd.player_id=p.id LEFT JOIN teams t ON p.team_id=t.id
    GROUP BY t.id
  `).all();
  res.json(rows);
});

module.exports = router;
