const { query } = require('../db');

class Indicator {
  static async create({ name, subdivision_id, measurement_unit, aggregation_type, description }) {
    const result = await query(
      'INSERT INTO indicators (name, subdivision_id, measurement_unit, aggregation_type, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, subdivision_id, measurement_unit, aggregation_type, description]
    );
    return result.rows[0];
  }

  static async findAll() {
    const result = await query(`
      SELECT i.*, s.name as subdivision_name 
      FROM indicators i
      JOIN subdivisions s ON i.subdivision_id = s.id
      WHERE i.is_active = TRUE
    `);
    return result.rows;
  }

  static async findBySubdivision(subdivision_id) {
    const result = await query(
      'SELECT * FROM indicators WHERE subdivision_id = $1 AND is_active = TRUE',
      [subdivision_id]
    );
    return result.rows;
  }

  static async update(id, { name, measurement_unit, aggregation_type, description }) {
    const result = await query(
      'UPDATE indicators SET name = $1, measurement_unit = $2, aggregation_type = $3, description = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
      [name, measurement_unit, aggregation_type, description, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await query(
      'UPDATE indicators SET is_active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }
}

module.exports = Indicator;