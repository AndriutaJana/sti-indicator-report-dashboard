const { query } = require('../db');

class User {
  static async create({ username, email, password_hash, role, subdivision_id }) {
    const result = await query(
      'INSERT INTO users (username, email, password_hash, role, subdivision_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role, subdivision_id',
      [username, email, password_hash, role, subdivision_id]
    );
    return result.rows[0];
  }

  

  static async findByUsername(username) {
    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(
      'SELECT id, username, email, role, subdivision_id, is_active FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  

  static async findAll() {
    const result = await query(
      'SELECT id, username, email, role, subdivision_id, is_active FROM users'
    );
    return result.rows;
  }

  static async update(id, { username, email, role, subdivision_id, is_active }) {
    const result = await query(
      'UPDATE users SET username = $1, email = $2, role = $3, subdivision_id = $4, is_active = $5, updated_at = NOW() WHERE id = $6 RETURNING id, username, email, role, subdivision_id, is_active',
      [username, email, role, subdivision_id, is_active, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    return result.rows[0];
  }
}



module.exports = User;