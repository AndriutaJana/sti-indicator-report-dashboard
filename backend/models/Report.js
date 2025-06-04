const { query } = require('../db');

class Report {
  static async create({ title, user_id, report_type, period_start, period_end, file_path }) {
    const result = await query(
      'INSERT INTO reports (title, user_id, report_type, period_start, period_end, file_path) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, user_id, report_type, period_start, period_end, file_path]
    );
    return result.rows[0];
  }

  static async findAll() {
    const result = await query('SELECT * FROM reports ORDER BY generated_at DESC');
    return result.rows;
  }

  static async findById(id) {
    const result = await query('SELECT * FROM reports WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByUserId(user_id) {
    const result = await query('SELECT * FROM reports WHERE user_id = $1 ORDER BY generated_at DESC', [user_id]);
    return result.rows;
  }

  static async delete(id) {
    const result = await query('DELETE FROM reports WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
}

module.exports = Report;