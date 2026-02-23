const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const facilities = db.prepare(`SELECT f.*, (SELECT COUNT(*) FROM bookings b WHERE b.facility_id=f.id AND b.date >= date('now')) as upcoming_bookings FROM facilities f ORDER BY f.name`).all();
  res.json(facilities);
});

router.get('/:id', (req, res) => {
  const fac = db.prepare('SELECT * FROM facilities WHERE id=?').get(req.params.id);
  if (!fac) return res.status(404).json({ error: 'Facility not found' });
  fac.bookings = db.prepare(`SELECT b.*, u.name as booked_by_name, e.title as event_title FROM bookings b LEFT JOIN users u ON b.booked_by=u.id LEFT JOIN events e ON b.event_id=e.id WHERE b.facility_id=? AND b.date >= date('now') ORDER BY b.date, b.start_time`).all(fac.id);
  res.json(fac);
});

router.post('/', (req, res) => {
  const { name, type, capacity, description } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const r = db.prepare('INSERT INTO facilities (name,type,capacity,description) VALUES (?,?,?,?)').run(name, type||null, capacity||null, description||null);
  res.status(201).json({ id: r.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const { name, type, capacity, description, status, maintenance_note, maintenance_return } = req.body;
  db.prepare('UPDATE facilities SET name=COALESCE(?,name),type=COALESCE(?,type),capacity=COALESCE(?,capacity),description=COALESCE(?,description),status=COALESCE(?,status),maintenance_note=COALESCE(?,maintenance_note),maintenance_return=COALESCE(?,maintenance_return) WHERE id=?')
    .run(name,type,capacity,description,status,maintenance_note||null,maintenance_return||null,req.params.id);
  res.json({ ok: true });
});

// POST /api/facilities/:id/book
router.post('/:id/book', (req, res) => {
  const { date, start_time, end_time, event_id, notes } = req.body;
  if (!date) return res.status(400).json({ error: 'date required' });
  // check for conflict
  const conflict = db.prepare('SELECT id FROM bookings WHERE facility_id=? AND date=? AND ((start_time < ? AND end_time > ?) OR start_time=?)').get(req.params.id, date, end_time, start_time, start_time);
  if (conflict) return res.status(409).json({ error: 'Facility already booked at that time' });
  const r = db.prepare('INSERT INTO bookings (facility_id,event_id,date,start_time,end_time,booked_by,notes) VALUES (?,?,?,?,?,?,?)').run(req.params.id, event_id||null, date, start_time||null, end_time||null, req.user.id, notes||null);
  // mark in_use if today
  if (date === new Date().toISOString().slice(0,10)) {
    db.prepare("UPDATE facilities SET status='in_use' WHERE id=?").run(req.params.id);
  }
  res.status(201).json({ id: r.lastInsertRowid });
});

router.get('/stats/summary', (req, res) => {
  const total       = db.prepare('SELECT COUNT(*) as c FROM facilities').get().c;
  const available   = db.prepare("SELECT COUNT(*) as c FROM facilities WHERE status='available'").get().c;
  const maintenance = db.prepare("SELECT COUNT(*) as c FROM facilities WHERE status='maintenance'").get().c;
  const weekBookings= db.prepare("SELECT COUNT(*) as c FROM bookings WHERE date BETWEEN date('now') AND date('now','+6 days')").get().c;
  res.json({ total, available, maintenance, week_bookings: weekBookings });
});

module.exports = router;
