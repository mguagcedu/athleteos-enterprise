const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const { category, q } = req.query;
  let sql = 'SELECT * FROM inventory WHERE 1=1';
  const params = [];
  if (category) { sql += ' AND category=?'; params.push(category); }
  if (q)        { sql += ' AND (name LIKE ? OR sku LIKE ?)'; params.push(`%${q}%`,`%${q}%`); }
  sql += ' ORDER BY category, name';
  const items = db.prepare(sql).all(...params).map(item => ({
    ...item,
    low_stock: item.quantity <= item.low_stock_threshold
  }));
  res.json(items);
});

router.get('/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM inventory WHERE id=?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
});

router.post('/', (req, res) => {
  const { name, sku, category, quantity, low_stock_threshold, unit_price, sizes, location } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const r = db.prepare('INSERT INTO inventory (name,sku,category,quantity,low_stock_threshold,unit_price,sizes,location) VALUES (?,?,?,?,?,?,?,?)')
    .run(name, sku||null, category||null, quantity||0, low_stock_threshold||5, unit_price||0, sizes||null, location||null);
  res.status(201).json({ id: r.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const { name, sku, category, quantity, low_stock_threshold, unit_price, sizes, location } = req.body;
  db.prepare('UPDATE inventory SET name=COALESCE(?,name),sku=COALESCE(?,sku),category=COALESCE(?,category),quantity=COALESCE(?,quantity),low_stock_threshold=COALESCE(?,low_stock_threshold),unit_price=COALESCE(?,unit_price),sizes=COALESCE(?,sizes),location=COALESCE(?,location) WHERE id=?')
    .run(name,sku,category,quantity!=null?quantity:null,low_stock_threshold,unit_price,sizes,location,req.params.id);
  res.json({ ok: true });
});

// PATCH /api/inventory/:id/adjust  — adjust stock level
router.patch('/:id/adjust', (req, res) => {
  const { delta } = req.body; // +/- number
  if (delta === undefined) return res.status(400).json({ error: 'delta required' });
  db.prepare('UPDATE inventory SET quantity=MAX(0,quantity+?) WHERE id=?').run(Number(delta), req.params.id);
  const item = db.prepare('SELECT * FROM inventory WHERE id=?').get(req.params.id);
  res.json(item);
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM inventory WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

router.get('/stats/summary', (req, res) => {
  const total     = db.prepare('SELECT COUNT(*) as c FROM inventory').get().c;
  const low       = db.prepare('SELECT COUNT(*) as c FROM inventory WHERE quantity <= low_stock_threshold').get().c;
  const value     = db.prepare('SELECT COALESCE(SUM(quantity*unit_price),0) as s FROM inventory').get().s;
  const outOfStock= db.prepare('SELECT COUNT(*) as c FROM inventory WHERE quantity=0').get().c;
  res.json({ total, low_stock: low, total_value: value, out_of_stock: outOfStock });
});

module.exports = router;
