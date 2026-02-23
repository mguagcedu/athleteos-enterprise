const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
router.use(requireAuth);

// GET /api/safety/docs  — compliance overview per player
router.get('/docs', (req, res) => {
  const { player_id, status } = req.query;
  let sql = `SELECT cd.*, p.first_name||" "||p.last_name as player_name, p.avatar, t.name as team_name FROM compliance_docs cd JOIN players p ON cd.player_id=p.id LEFT JOIN teams t ON p.team_id=t.id WHERE 1=1`;
  const params = [];
  if (player_id) { sql += ' AND cd.player_id=?'; params.push(player_id); }
  if (status)    { sql += ' AND cd.status=?'; params.push(status); }
  sql += ' ORDER BY p.last_name, cd.doc_type';
  res.json(db.prepare(sql).all(...params));
});

// GET /api/safety/summary  — high-level counts
router.get('/summary', (req, res) => {
  const total       = db.prepare('SELECT COUNT(*) as c FROM compliance_docs').get().c;
  const complete    = db.prepare("SELECT COUNT(*) as c FROM compliance_docs WHERE status='complete'").get().c;
  const missing     = db.prepare("SELECT COUNT(*) as c FROM compliance_docs WHERE status='missing'").get().c;
  const players_ok  = db.prepare(`SELECT COUNT(DISTINCT player_id) as c FROM compliance_docs WHERE player_id NOT IN (SELECT player_id FROM compliance_docs WHERE status='missing')`).get().c;
  const players_bad = db.prepare(`SELECT COUNT(DISTINCT player_id) as c FROM compliance_docs WHERE status='missing'`).get().c;
  res.json({ total, complete, missing, players_compliant: players_ok, players_missing: players_bad });
});

// PUT /api/safety/docs/:id  — mark as complete
router.put('/docs/:id', (req, res) => {
  const { status, signed_at, expires_at } = req.body;
  db.prepare('UPDATE compliance_docs SET status=COALESCE(?,status),signed_at=COALESCE(?,signed_at),expires_at=COALESCE(?,expires_at) WHERE id=?')
    .run(status||null, signed_at||null, expires_at||null, req.params.id);
  res.json({ ok: true });
});

// POST /api/safety/docs  — add a doc record
router.post('/docs', (req, res) => {
  const { player_id, doc_type, file_name, signed_at, expires_at, status } = req.body;
  if (!player_id || !doc_type) return res.status(400).json({ error: 'player_id and doc_type required' });
  const r = db.prepare('INSERT INTO compliance_docs (player_id,doc_type,file_name,signed_at,expires_at,status) VALUES (?,?,?,?,?,?)')
    .run(player_id, doc_type, file_name||null, signed_at||null, expires_at||null, status||'pending');
  res.status(201).json({ id: r.lastInsertRowid });
});

module.exports = router;
