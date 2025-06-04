const { query } = require('../db');
const ReportService = require('../services/reportService');
const path = require('path');
const fs = require('fs');

// Funcție helper pentru generare raport
const handleReportGeneration = async (req, res, periodType) => {
  try {
    const subdivisionId = req.body.subdivision_id; // Folosește doar req.body.subdivision_id
    
    console.log('req.body.subdivision_id:', req.body.subdivision_id); // Log pentru debug
    console.log('subdivisionId folosit:', subdivisionId); // Log pentru debug
    
    if (!subdivisionId) {
      return res.status(400).json({ message: 'ID subdiviziune necesar' });
    }

    // Obține numele subdiviziunii din tabela subdivisions
    const subdivisionQuery = await query(
      'SELECT name FROM subdivisions WHERE id = $1',
      [subdivisionId]
    );

    if (!subdivisionQuery.rows.length) {
      return res.status(404).json({ message: 'Subdiviziunea nu a fost găsită' });
    }

    const subdivisionName = subdivisionQuery.rows[0].name;
    console.log('subdivisionName:', subdivisionName); // Log pentru debug

    const result = await ReportService.generateReport(subdivisionId, periodType);
    
    // Salvează raportul cu titlul corect
    await query(
      'INSERT INTO reports (title, user_id, report_type, period_start, period_end, file_path) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        `Raport ${periodType} - ${subdivisionName}`,
        req.user.id,
        periodType,
        new Date(new Date().setDate(new Date().getDate() - (periodType === 'annual' ? 365 : periodType === 'quarterly' ? 90 : 7))),
        new Date(),
        JSON.stringify(result.downloadUrls)
      ]
    );

    res.json({
      message: `Raport ${periodType} generat cu succes`,
      downloadUrls: result.downloadUrls
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Eroare la generarea raportului ${periodType}` });
  }
};

exports.generateWeeklyReport = async (req, res) => {
  await handleReportGeneration(req, res, 'weekly');
};

exports.generateQuarterlyReport = async (req, res) => {
  await handleReportGeneration(req, res, 'quarterly');
};

exports.generateAnnualReport = async (req, res) => {
  await handleReportGeneration(req, res, 'annual');
};

exports.listReports = async (req, res) => {
  try {
    const reports = await query(
      'SELECT r.*, u.username FROM reports r JOIN users u ON r.user_id = u.id ORDER BY r.generated_at DESC'
    );
    res.json(reports.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Eroare server' });
  }
};

exports.downloadReport = async (req, res) => {
  try {
    const { fileName } = req.params;
    const filePath = path.join(__dirname, '../../reports', fileName);
    
    if (fs.existsSync(filePath)) {
      // Setează headerele în funcție de tipul fișierului
      if (fileName.endsWith('.pdf')) {
        res.setHeader('Content-Type', 'application/pdf');
      } else if (fileName.endsWith('.xlsx')) {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      }
      
      res.download(filePath);
    } else {
      res.status(404).json({ message: 'Fișierul nu a fost găsit' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Eroare server' });
  }
};