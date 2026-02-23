const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
router.use(requireAuth);

// GET /api/events  ?date=&team_id=&month=YYYY-MM
router.get('/', (req, res) => {
  const { date, team_id, month } = req.query;
  let sql = `SELECT e.*, t.name as team_name, t.color as team_color, f.name as facility_name FROM events e LEFT JOIN teams t ON e.team_id=t.id LEFT JOIN facilities f ON e.facility_id=f.id WHERE 1=1`;
  const params = [];
  if (date)    { sql += ' AND e.date=?'; params.push(date); }
  if (team_id) { sql += ' AND e.team_id=?'; params.push(team_id); }
  if (month)   { sql += ' AND e.date LIKE ?'; params.push(`${month}%`); }
  sql += ' ORDER BY e.date, e.start_time';
  res.json(db.prepare(sql).all(...params));
});

// GET /api/events/:id
router.get('/:id', (req, res) => {
  const event = db.prepare(`SELECT e.*, t.name as team_name, f.name as facility_name FROM events e LEFT JOIN teams t ON e.team_id=t.id LEFT JOIN facilities f ON e.facility_id=f.id WHERE e.id=?`).get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(event);
});

// POST /api/events
router.post('/', (req, res) => {
  const { title, event_type, date, start_time, end_time, facility_id, team_id, opponent, notes, notify_parents, require_rsvp, repeat_rule } = req.body;
  if (!title || !date) return res.status(400).json({ error: 'title and date required' });
  const r = db.prepare(`INSERT INTO events (title,event_type,date,start_time,end_time,facility_id,team_id,opponent,notes,notify_parents,require_rsvp,repeat_rule,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(title, event_type||'practice', date, start_time||null, end_time||null, facility_id||null, team_id||null, opponent||null, notes||null, notify_parents?1:0, require_rsvp?1:0, repeat_rule||null, req.user.id);
  res.status(201).json({ id: r.lastInsertRowid });
});

// PUT /api/events/:id
router.put('/:id', (req, res) => {
  const { title, event_type, date, start_time, end_time, facility_id, team_id, opponent, notes } = req.body;
  db.prepare(`UPDATE events SET title=COALESCE(?,title),event_type=COALESCE(?,event_type),date=COALESCE(?,date),start_time=COALESCE(?,start_time),end_time=COALESCE(?,end_time),facility_id=COALESCE(?,facility_id),team_id=COALESCE(?,team_id),opponent=COALESCE(?,opponent),notes=COALESCE(?,notes) WHERE id=?`)
    .run(title,event_type,date,start_time,end_time,facility_id,team_id,opponent,notes,req.params.id);
  res.json({ ok: true });
});

// DELETE /api/events/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM events WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// GET /api/events/stats/week  ?start=YYYY-MM-DD
router.get('/stats/week', (req, res) => {
  const start = req.query.start || new Date().toISOString().slice(0, 10);
  const end = new Date(new Date(start).getTime() + 6 * 86400000).toISOString().slice(0, 10);
  const events = db.prepare(`SELECT e.*, t.name as team_name, t.color as team_color, f.name as facility_name FROM events e LEFT JOIN teams t ON e.team_id=t.id LEFT JOIN facilities f ON e.facility_id=f.id WHERE e.date BETWEEN ? AND ? ORDER BY e.date, e.start_time`).all(start, end);
  res.json(events);
});

module.exports = router;
