// controllers/indicatorController.js
const { query } = require('../db');
const { v4: uuidv4 } = require('uuid');

// Creare indicator
// Creare indicator
exports.createIndicator = async (req, res) => {
  try {
    const { name, subdivision_id, measurement_unit, aggregation_type, description } = req.body;

    console.log("Date primite pentru crearea indicatorului: ", req.body);
    
    if (!name || !subdivision_id || !measurement_unit || !aggregation_type) {
      return res.status(400).json({
        success: false,
        message: 'Toate câmpurile obligatorii trebuie completate'
      });
    }

    // Verifică dacă subdivision_id este un număr
    const parsedSubdivisionId = parseInt(subdivision_id);
    if (isNaN(parsedSubdivisionId)) {
      return res.status(400).json({
        success: false,
        message: 'subdivision_id trebuie să fie un număr întreg'
      });
    }

    const checkQuery = 'SELECT * FROM indicators WHERE name = $1 AND subdivision_id = $2';
    const checkResult = await query(checkQuery, [name, parsedSubdivisionId]);

    if (checkResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Indicatorul există deja pentru această subdiviziune'
      });
    }

    const insertQuery = `
    INSERT INTO indicators
    (name, subdivision_id, measurement_unit, aggregation_type, description, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    RETURNING *
  `;

    const newIndicator = await query(insertQuery, [
      name,
      parsedSubdivisionId,  // Folosește parsedSubdivisionId (ca integer)
      measurement_unit,
      aggregation_type,
      description || null
    ]);

    res.status(201).json({
      success: true,
      message: 'Indicator creat cu succes',
      data: newIndicator.rows[0]
    });

  } catch (error) {
    console.error('Eroare la crearea indicatorului:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare internă la server',
      error: error.message
    });
  }
};


// Obținerea indicatorilor
exports.getIndicators = async (req, res) => {
  try {
    const queryText = `
      SELECT 
        i.*, 
        s.name as subdivision_name,
        COUNT(r.id) as records_count
      FROM indicators i
      LEFT JOIN subdivisions s ON i.subdivision_id = s.id
      LEFT JOIN indicator_records r ON i.id = r.indicator_id
      GROUP BY i.id, s.name
      ORDER BY i.created_at DESC
    `;
    
    const result = await query(queryText);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Eroare la obținerea indicatorilor:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la obținerea indicatorilor'
    });
  }
};

// Obținerea indicatorilor pentru o subdiviziune
exports.getIndicatorsBySubdivision = async (req, res) => {
  try {
    const { subdivisionId } = req.params;
    const queryText = `
      SELECT 
        i.*, 
        s.name as subdivision_name,
        COUNT(r.id) as records_count
      FROM indicators i
      LEFT JOIN subdivisions s ON i.subdivision_id = s.id
      LEFT JOIN indicator_records r ON i.id = r.indicator_id
      WHERE i.subdivision_id = $1
      GROUP BY i.id, s.name
      ORDER BY i.created_at DESC
    `;
    const result = await query(queryText, [subdivisionId]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Eroare la obținerea indicatorilor pentru subdiviziune:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la obținerea indicatorilor pentru subdiviziune'
    });
  }
};

// Salvarea înregistrărilor indicatorilor
exports.saveIndicatorRecords = async (req, res) => {
  try {
    const { indicator_id, records } = req.body;
    
    if (!indicator_id || !records || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Trebuie să furnizezi indicator_id și înregistrări valide'
      });
    }

    const insertQuery = `
      INSERT INTO indicator_records (id, indicator_id, value, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `;
    
    const savedRecords = [];
    for (const record of records) {
      const newRecord = await query(insertQuery, [uuidv4(), indicator_id, record.value]);
      savedRecords.push(newRecord.rows[0]);
    }

    res.status(201).json({
      success: true,
      message: 'Înregistrările au fost salvate cu succes',
      data: savedRecords
    });
  } catch (error) {
    console.error('Eroare la salvarea înregistrărilor indicatorilor:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare internă la server'
    });
  }
};

// Obținerea înregistrărilor pentru subdiviziune
exports.getSubdivisionRecords = async (req, res) => {
  try {
    const { subdivisionId } = req.params;
    const queryText = `
      SELECT 
        r.*, 
        i.name as indicator_name
      FROM indicator_records r
      LEFT JOIN indicators i ON r.indicator_id = i.id
      WHERE i.subdivision_id = $1
      ORDER BY r.created_at DESC
    `;
    
    const result = await query(queryText, [subdivisionId]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Eroare la obținerea înregistrărilor pentru subdiviziune:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la obținerea înregistrărilor pentru subdiviziune'
    });
  }
};

// Actualizarea unui indicator
exports.updateIndicator = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subdivision_id, measurement_unit, aggregation_type, description } = req.body;

    const updateQuery = `
      UPDATE indicators
      SET name = $1, subdivision_id = $2, measurement_unit = $3, aggregation_type = $4, description = $5, updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `;

    const updatedIndicator = await query(updateQuery, [
      name, 
      subdivision_id, 
      measurement_unit, 
      aggregation_type, 
      description, 
      id
    ]);

    if (updatedIndicator.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Indicatorul nu a fost găsit'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Indicator actualizat cu succes',
      data: updatedIndicator.rows[0]
    });
  } catch (error) {
    console.error('Eroare la actualizarea indicatorului:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare internă la server'
    });
  }
};

// Ștergerea unui indicator
exports.deleteIndicator = async (req, res) => {
  try {
    const { id } = req.params;

    await query('DELETE FROM indicator_records WHERE indicator_id = $1', [id]);
    
    const deleteQuery = 'DELETE FROM indicators WHERE id = $1 RETURNING *';

    const deletedIndicator = await query(deleteQuery, [id]);

    if (deletedIndicator.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Indicatorul nu a fost găsit'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Indicator șters cu succes',
      data: deletedIndicator.rows[0]
    });
  } catch (error) {
    console.error('Eroare la ștergerea indicatorului:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare internă la server'
    });
  }
};



