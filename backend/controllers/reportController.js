const { query } = require('../db');
const ReportService = require('../services/reportService');
const path = require('path');
const fs = require('fs');

// Funcție helper pentru generare raport
const handleReportGeneration = async (req, res, periodType) => {
  try {
    const { subdivision_id, activities = [] } = req.body; // Extrage activities din body
    
    console.log('req.body:', req.body); // Log pentru debug
    
    if (!subdivision_id) {
      return res.status(400).json({ message: 'ID subdiviziune necesar' });
    }

    const subdivisionQuery = await query(
      'SELECT name FROM subdivisions WHERE id = $1',
      [subdivision_id]
    );

    if (!subdivisionQuery.rows.length) {
      return res.status(404).json({ message: 'Subdiviziunea nu a fost găsită' });
    }

    const subdivisionName = subdivisionQuery.rows[0].name;
    console.log('Generare raport pentru:', { subdivisionName, periodType, activities });

    // Trimite activities către ReportService
    const result = await ReportService.generateReport(
      subdivision_id, 
      periodType,
      "", // description poate fi gol
      activities // Adaugă activitățile
    );
    
    // Salvează raportul cu titlul corect
    await query(
      'INSERT INTO reports (title, user_id, report_type, period_start, period_end, file_path, activities) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [
        `Raport ${periodType} - ${subdivisionName}`,
        req.user.id,
        periodType,
        new Date(new Date().setDate(new Date().getDate() - (
        periodType === 'annual' ? 365 :
        periodType === 'quarterly' ? 90 :
        periodType === 'monthly' ? 30 : 
        7
      ))),
        new Date(),
        JSON.stringify(result.downloadUrls),
        JSON.stringify(activities) // Salvează activitățile ca JSON
      ]
    );

    res.json({
      message: `Raport ${periodType} generat cu succes`,
      downloadUrls: result.downloadUrls,
      activities // Returnează activitățile în răspuns
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      message: `Eroare la generarea raportului ${periodType}`,
      error: error.message 
    });
  }
};

exports.generateAllReports = async (req, res) => {
  try {
    const { periodType, description, activities = [] } = req.body;

    if (!['weekly','monthly', 'quarterly', 'annual'].includes(periodType)) {
      return res.status(400).json({ message: 'Tip de raport invalid' });
    }
    
    const periodStart = new Date();
    periodStart.setDate(
    periodStart.getDate() - (
    periodType === 'annual' ? 365 :
    periodType === 'quarterly' ? 90 :
    periodType === 'monthly' ? 30 : 
    7
  )
);

    const result = await ReportService.generateAllSubdivisionReports(
      periodType,
      description,
      activities // Trimite activitățile către serviciu
    );
    
    // Salvează în baza de date (opțional)
    await query(
      'INSERT INTO reports (title, user_id, report_type, period_start, period_end, file_path, activities) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [
        `Raport ${periodType} - Toate subdiviziunile`,
        req.user.id,
        periodType,
        periodStart,
        new Date(),
        JSON.stringify(result.downloadUrls),
        JSON.stringify(activities)
      ]
    );

    res.json({
      ...result,
      activities // Include activitățile în răspuns
    });
  } catch (error) {
    console.error("Eroare la generarea tuturor rapoartelor:", error);
    res.status(500).json({ 
      message: 'Eroare la generarea rapoartelor',
      error: error.message 
    });
  }
};

exports.generateWeeklyReport = async (req, res) => {
  await handleReportGeneration(req, res, 'weekly');
};

exports.generateMonthlyReport = async (req, res) => {
  await handleReportGeneration(req, res, 'monthly');
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
    
    // Parsează activitățile din JSON (dacă există)
    const reportsWithActivities = reports.rows.map(report => ({
      ...report,
      activities: report.activities ? JSON.parse(report.activities) : []
    }));
    
    res.json(reportsWithActivities);
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