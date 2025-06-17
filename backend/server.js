const express = require('express');
const cors = require('cors');
const path = require('path');
const { pool } = require('./db');

// Import rute
const authRoutes = require('./routes/authRoutes');
const indicatorRoutes = require('./routes/indicatorRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');
const indicatorRecordRoutes = require('./routes/indicatorRecordRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true,
  
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/reports', express.static(path.join(__dirname, 'reports')));

app.use(express.static(path.join(__dirname, '../frontend/dist')));
// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to the database', err);
  } else {
    console.log('Database connected successfully');
  }
});

// Routes

app.use('/api/auth', authRoutes);
app.use('/api/indicators', indicatorRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/indicator-records', indicatorRecordRoutes);

app.get('/api/reports/download/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'reports', req.params.filename);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Eroare la trimiterea fișierului:', err);
      res.status(500).send('Nu s-a putut trimite fișierul.');
    }
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

// Error handling middlewarea
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});




 


