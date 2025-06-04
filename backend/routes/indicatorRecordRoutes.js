// backend/routes/indicatorRecordRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate } = require('../middlewares/authMiddleware');

// POST - Creează o nouă înregistrare
router.post('/', authenticate, async (req, res) => {
  const indicatorId = req.body.indicatorId || req.body.indicator_id;
  const value = req.body.value;
   const recordDate = req.body.recordDate || req.body.record_date;
  const notes = req.body.notes;
  const userId = req.user.id;

   if (!userId) {
    console.error('Error: User ID is missing after authentication middleware.');
    return res.status(400).json({ error: 'User ID is required for this operation.' });
  }
  if (!indicatorId) {
    return res.status(400).json({ error: 'Indicator ID is required.' });
  }
  if (!value) {
    return res.status(400).json({ error: 'Value is required.' });
  }
  if (!recordDate) {
    return res.status(400).json({ error: 'Record date is required.' });
  }



  try {
    const result = await pool.query(
      `INSERT INTO indicator_records 
        (indicator_id, user_id, value, record_date, notes, created_at, updated_at) 
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
        RETURNING *`,
      [indicatorId, userId, value, recordDate, notes || null]
    );
    res.status(201).json({ message: 'Înregistrare salvată cu succes.', data: result.rows[0] });
  } catch (error) {
    console.error('Eroare la salvare:', error);
    res.status(500).json({ error: 'Eroare la salvarea înregistrării.' });
  }
});

// GET - Obține toate înregistrările sau filtrate după indicator_id
router.get('/', authenticate, async (req, res) => {
  try {
    const { indicator_id } = req.query;
    let query = `
      SELECT ir.*, i.name, i.subdivision_id 
      FROM indicator_records ir 
      JOIN indicators i ON ir.indicator_id = i.id
    `;
    const values = [];
    if (indicator_id) {
      query += ' WHERE ir.indicator_id = $1';
      values.push(indicator_id);
    }
    const result = await pool.query(query, values);
    res.status(200).json({ message: 'Înregistrări încărcate cu succes.', data: result.rows });
  } catch (error) {
    console.error('Eroare la încărcarea înregistrărilor:', error);
    res.status(500).json({ error: 'Eroare la încărcarea înregistrărilor.' });
  }
});

// PUT - Actualizează o înregistrare existentă
router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  // Acceptă atât recordDate cât și record_date
  const recordDate = req.body.recordDate || req.body.record_date;
  const { indicator_id, value, notes } = req.body;
  const userId = req.user.id;

  if (!userId) {
    console.error('Error: User ID is missing after authentication middleware.');
    return res.status(400).json({ error: 'User ID is required for this operation.' });
  }

  if (!recordDate) {
    return res.status(400).json({ error: 'Data înregistrării (recordDate) este obligatorie.' });
  }

  try {
    const result = await pool.query(
      `UPDATE indicator_records 
       SET indicator_id = $1, value = $2, record_date = $3, notes = $4, user_id = $5, updated_at = NOW()
       WHERE id = $6 
       RETURNING *`,
      [indicator_id, value, recordDate, notes || null, userId, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Înregistrarea nu a fost găsită.' });
    }
    res.status(200).json({ message: 'Înregistrare actualizată cu succes.', data: result.rows[0] });
  } catch (error) {
    console.error('Eroare la actualizarea înregistrării:', error);
    res.status(500).json({ error: 'Eroare la actualizarea înregistrării.' });
  }
});

module.exports = router;