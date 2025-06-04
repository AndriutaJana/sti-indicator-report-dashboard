const { query } = require('../db');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await query(
      'SELECT id, username, email, role, subdivision_id, is_active FROM users'
    );
    res.json(users.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Eroare server' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await query(
      'SELECT id, username, email, role, subdivision_id, is_active FROM users WHERE id = $1',
      [req.params.id]
    );
    
    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'Utilizatorul nu a fost găsit' });
    }

    res.json(user.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Eroare server' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, subdivision_id, is_active } = req.body;

    const updatedUser = await query(
      'UPDATE users SET username = $1, email = $2, role = $3, subdivision_id = $4, is_active = $5, updated_at = NOW() WHERE id = $6 RETURNING id, username, email, role, subdivision_id, is_active',
      [username, email, role, subdivision_id, is_active, id]
    );

    if (updatedUser.rows.length === 0) {
      return res.status(404).json({ message: 'Utilizatorul nu a fost găsit' });
    }

    res.json(updatedUser.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Eroare server' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Utilizatorul nu a fost găsit' });
    }

    res.json({ message: 'Utilizator șters cu succes' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Eroare server' });
  }
};