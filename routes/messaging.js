const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
router.use(requireAuth);

// GET /api/conversations
router.get('/conversations', (req, res) => {
  const convs = db.prepare('SELECT * FROM conversations ORDER BY last_at DESC').all();
  res.json(convs);
});

// POST /api/conversations
router.post('/conversations', (req, res) => {
  const { name, type, team_id } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const r = db.prepare('INSERT INTO conversations (name,type,team_id) VALUES (?,?,?)').run(name, type||'direct', team_id||null);
  res.status(201).json({ id: r.lastInsertRowid });
});

// GET /api/conversations/:id/messages
router.get('/conversations/:id/messages', (req, res) => {
  const msgs = db.prepare('SELECT * FROM messages WHERE conversation_id=? ORDER BY created_at ASC').all(req.params.id);
  // mark as read
  db.prepare('UPDATE conversations SET unread_count=0 WHERE id=?').run(req.params.id);
  res.json(msgs);
});

// POST /api/conversations/:id/messages
router.post('/conversations/:id/messages', (req, res) => {
  const { body } = req.body;
  if (!body?.trim()) return res.status(400).json({ error: 'body required' });
  const r = db.prepare('INSERT INTO messages (conversation_id,sender_id,sender_name,body) VALUES (?,?,?,?)')
    .run(req.params.id, req.user.id, req.user.name, body.trim());
  // update conversation last_message
  db.prepare('UPDATE conversations SET last_message=?,last_at=CURRENT_TIMESTAMP WHERE id=?').run(body.trim().slice(0,80), req.params.id);
  const msg = db.prepare('SELECT * FROM messages WHERE id=?').get(r.lastInsertRowid);
  res.status(201).json(msg);
});

// GET /api/messaging/unread
router.get('/unread', (req, res) => {
  const count = db.prepare('SELECT COALESCE(SUM(unread_count),0) as c FROM conversations').get().c;
  res.json({ unread: count });
});

module.exports = router;
