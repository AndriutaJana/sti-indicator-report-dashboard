const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const LDAPService = require('../services/ldap');
require('dotenv').config();

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // 1) Încercăm autentificarea LDAP
    const ldapUser = await LDAPService.authenticate(username, password);

    if (!ldapUser.isAuthorized) {
      return res.status(403).json({ message: 'Nu aveți drepturile necesare' });
    }

    // 2) Verificăm dacă utilizatorul există deja în baza de date
    const findDbUser = await query('SELECT * FROM users WHERE username = $1', [username]);

    let user;
    if (findDbUser.rows.length === 0) {
      // 3) Creăm cont local pentru utilizatorul LDAP
      // Notă: Nu salvăm parola LDAP, setăm password_hash la null

      const userRole = ldapUser.isAuthorized ? 'admin' : 'user';
      const createResult = await query(
        `INSERT INTO users 
           (username, email, role, subdivision_id, is_active, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
         RETURNING id, username, email, role, subdivision_id, is_active`,
        [username, ldapUser.email, userRole, null, true]
      );
      user = createResult.rows[0];
    } else {
      user = findDbUser.rows[0];
      // Opțional: Actualizăm email-ul sau alte câmpuri dacă s-au schimbat în LDAP
      if (user.email !== ldapUser.email) {
        await query(
          'UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2',
          [ldapUser.email, user.id]
        );
        user.email = ldapUser.email;
      }
    }

    // 4) Generăm token-ul JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    console.log('Token payload:', { id: user.id, role: user.role });

    // 5) Returnăm răspunsul cu token și datele user-ului
    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        subdivision_id: user.subdivision_id
      }
    });
  } catch (err) {
    console.error('Eroare în authController.login:', err);
    return res.status(401).json({ message: 'Date de autentificare invalide sau eroare LDAP' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const dbUser = await query(
      'SELECT id, username, email, role, subdivision_id, is_active FROM users WHERE id = $1',
      [req.user.id]
    );
    if (dbUser.rows.length === 0) {
      return res.status(404).json({ message: 'Utilizatorul nu a fost găsit' });
    }
    return res.json(dbUser.rows[0]);
  } catch (error) {
    console.error('Eroare în authController.getMe:', error);
    return res.status(500).json({ message: 'Eroare server' });
  }
};