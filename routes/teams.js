const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const teams = db.prepare('SELECT t.*, u.name as coach_name, (SELECT COUNT(*) FROM players p WHERE p.team_id=t.id AND p.status="active") as player_count FROM teams t LEFT JOIN users u ON t.coach_id=u.id ORDER BY t.name').all();
  res.json(teams);
});

router.post('/', (req, res) => {
  const { name, sport, age_group, season, coach_id, color } = req.body;
  if (!name || !sport) return res.status(400).json({ error: 'name and sport required' });
  const r = db.prepare('INSERT INTO teams (name,sport,age_group,season,coach_id,color) VALUES (?,?,?,?,?,?)').run(name,sport,age_group||null,season||null,coach_id||null,color||'#0ea5e9');
  res.status(201).json({ id: r.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const { name, sport, age_group, season, coach_id, color } = req.body;
  db.prepare('UPDATE teams SET name=COALESCE(?,name),sport=COALESCE(?,sport),age_group=COALESCE(?,age_group),season=COALESCE(?,season),coach_id=COALESCE(?,coach_id),color=COALESCE(?,color) WHERE id=?')
    .run(name,sport,age_group,season,coach_id,color,req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM teams WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
