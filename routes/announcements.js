const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const { audience, priority } = req.query;
  let sql = 'SELECT * FROM announcements WHERE 1=1';
  const params = [];
  if (audience) { sql += ' AND audience=?'; params.push(audience); }
  if (priority) { sql += ' AND priority=?'; params.push(priority); }
  sql += ' ORDER BY pinned DESC, created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

router.post('/', (req, res) => {
  const { title, body, audience, team_id, priority, pinned } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'title and body required' });
  const r = db.prepare('INSERT INTO announcements (title,body,audience,team_id,priority,pinned,author_id,author_name) VALUES (?,?,?,?,?,?,?,?)')
    .run(title, body, audience||'all', team_id||null, priority||'normal', pinned?1:0, req.user.id, req.user.name);
  res.status(201).json({ id: r.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const { title, body, audience, priority, pinned } = req.body;
  db.prepare('UPDATE announcements SET title=COALESCE(?,title),body=COALESCE(?,body),audience=COALESCE(?,audience),priority=COALESCE(?,priority),pinned=COALESCE(?,pinned) WHERE id=?')
    .run(title,body,audience,priority,pinned!=null?pinned:null,req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM announcements WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
