const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Static frontend
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/players',       require('./routes/players'));
app.use('/api/teams',         require('./routes/teams'));
app.use('/api/events',        require('./routes/events'));
app.use('/api/facilities',    require('./routes/facilities'));
app.use('/api/orders',        require('./routes/commerce'));
app.use('/api/inventory',     require('./routes/inventory'));
app.use('/api/messaging',     require('./routes/messaging'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/safety',        require('./routes/safety'));
app.use('/api/reports',       require('./routes/reports'));

// Catch-all → SPA (Express 5 wildcard syntax)
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AthleteOS running on http://localhost:${PORT}`));
