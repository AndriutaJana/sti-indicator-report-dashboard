const jwt = require('jsonwebtoken');
const { query } = require('../db');
require('dotenv').config();

exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ message: 'Autentificare necesară' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token lipsă' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Token invalid sau expirat' });
    }

    // Verificăm dacă există user-ul în baza de date
    const userResult = await query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Utilizator invalid' });
    }

    req.user = userResult.rows[0];
    next();
  } catch (err) {
    console.error('Eroare autentificare middleware:', err);
    return res.status(500).json({ message: 'Eroare server' });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Acces interzis' });
    }
    next();
  };
};
