const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
router.use(requireAuth);

// GET /api/players  ?team_id=&status=&q=
router.get('/', (req, res) => {
  const { team_id, status, q } = req.query;
  let sql = `SELECT p.*, t.name as team_name, t.color as team_color FROM players p LEFT JOIN teams t ON p.team_id=t.id WHERE 1=1`;
  const params = [];
  if (team_id) { sql += ' AND p.team_id=?'; params.push(team_id); }
  if (status)  { sql += ' AND p.status=?';  params.push(status); }
  if (q)       { sql += ' AND (p.first_name||" "||p.last_name LIKE ? OR p.jersey_number LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  sql += ' ORDER BY p.last_name,p.first_name';
  res.json(db.prepare(sql).all(...params));
});

// GET /api/players/:id  (full profile)
router.get('/:id', (req, res) => {
  const player = db.prepare(`SELECT p.*, t.name as team_name, t.color as team_color FROM players p LEFT JOIN teams t ON p.team_id=t.id WHERE p.id=?`).get(req.params.id);
  if (!player) return res.status(404).json({ error: 'Player not found' });
  player.forms  = db.prepare('SELECT * FROM player_forms WHERE player_id=?').all(player.id);
  player.docs   = db.prepare('SELECT * FROM compliance_docs WHERE player_id=?').all(player.id);
  player.notes  = db.prepare('SELECT * FROM coach_notes WHERE player_id=? ORDER BY created_at DESC').all(player.id);
  player.orders = db.prepare('SELECT * FROM orders WHERE player_id=? ORDER BY created_at DESC').all(player.id);
  res.json(player);
});

// POST /api/players
router.post('/', (req, res) => {
  const { first_name, last_name, dob, jersey_number, position, team_id, parent_name, parent_email, parent_phone } = req.body;
  if (!first_name || !last_name) return res.status(400).json({ error: 'first_name and last_name required' });
  const r = db.prepare(`INSERT INTO players (first_name,last_name,dob,jersey_number,position,team_id,parent_name,parent_email,parent_phone,member_since) VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(first_name, last_name, dob||null, jersey_number||null, position||null, team_id||null, parent_name||null, parent_email||null, parent_phone||null, new Date().toISOString().slice(0,7));
  // seed default forms
  ['registration','medical','photo_release'].forEach(ft =>
    db.prepare('INSERT INTO player_forms (player_id,form_type,status) VALUES (?,?,?)').run(r.lastInsertRowid, ft, 'pending'));
  res.status(201).json({ id: r.lastInsertRowid });
});

// PUT /api/players/:id
router.put('/:id', (req, res) => {
  const { first_name, last_name, dob, jersey_number, position, team_id, status, parent_name, parent_email, parent_phone, notes } = req.body;
  db.prepare(`UPDATE players SET first_name=COALESCE(?,first_name),last_name=COALESCE(?,last_name),dob=COALESCE(?,dob),jersey_number=COALESCE(?,jersey_number),position=COALESCE(?,position),team_id=COALESCE(?,team_id),status=COALESCE(?,status),parent_name=COALESCE(?,parent_name),parent_email=COALESCE(?,parent_email),parent_phone=COALESCE(?,parent_phone),notes=COALESCE(?,notes) WHERE id=?`)
    .run(first_name,last_name,dob,jersey_number,position,team_id,status,parent_name,parent_email,parent_phone,notes, req.params.id);
  res.json({ ok: true });
});

// DELETE /api/players/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM players WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// POST /api/players/:id/notes
router.post('/:id/notes', (req, res) => {
  const { body } = req.body;
  if (!body) return res.status(400).json({ error: 'body required' });
  const r = db.prepare('INSERT INTO coach_notes (player_id,author_id,author_name,body) VALUES (?,?,?,?)')
    .run(req.params.id, req.user.id, req.user.name, body);
  res.status(201).json({ id: r.lastInsertRowid });
});

// GET /api/players/stats/summary
router.get('/stats/summary', (req, res) => {
  const total    = db.prepare("SELECT COUNT(*) as c FROM players WHERE status='active'").get().c;
  const waitlist = db.prepare("SELECT COUNT(*) as c FROM players WHERE status='waitlist'").get().c;
  const teams    = db.prepare("SELECT COUNT(*) as c FROM teams").get().c;
  const formsOk  = db.prepare("SELECT COUNT(DISTINCT player_id) as c FROM player_forms WHERE status='complete'").get().c;
  const formsPct = total > 0 ? Math.round((formsOk / total) * 100) : 0;
  res.json({ total, waitlist, teams, forms_pct: formsPct });
});

module.exports = router;
