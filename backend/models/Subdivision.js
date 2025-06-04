const { query } = require('../db');

class Subdivision {
  static async create({ name, description }) {
    const result = await query(
      'INSERT INTO subdivisions (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    return result.rows[0];
  }

  static async findAll() {
    const result = await query('SELECT * FROM subdivisions ORDER BY name');
    return result.rows;
  }

  static async findById(id) {
    const result = await query('SELECT * FROM subdivisions WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async update(id, { name, description }) {
    const result = await query(
      'UPDATE subdivisions SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [name, description, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await query('DELETE FROM subdivisions WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
}

module.exports = Subdivision;