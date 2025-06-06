const { query } = require('../db');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const Handlebars = require('handlebars');

class ReportService {
  // Metodă comună pentru obținerea datelor
  static async getReportData(subdivisionId, periodStart) {
    // Obține indicatorii activi pentru subdiviziune
    const indicators = await query(
      'SELECT id, name, measurement_unit FROM indicators WHERE subdivision_id = $1 AND is_active = TRUE',
      [subdivisionId]
    );
    
    if (!indicators.rows.length) {
      throw new Error('Nu există indicatori pentru această subdiviziune');
    }
    
    // Obține înregistrările pentru perioada specificată
    const records = await query(
      `SELECT ir.indicator_id, ir.value, ir.record_date, i.name as indicator_name 
       FROM indicator_records ir
       JOIN indicators i ON ir.indicator_id = i.id
       WHERE i.subdivision_id = $1 AND ir.record_date >= $2
       ORDER BY ir.record_date DESC`,
      [subdivisionId, periodStart.toISOString().split('T')[0]]
    );
    
    return { indicators: indicators.rows, records: records.rows };
  }

  // Generare Excel
  static async generateExcelReport(data, fileName) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Raport subdiviziune');

    worksheet.columns = [
      { header: 'Categoria activitatii', key: 'indicator', width: 50 },
      { header: 'Numar', key: 'total', width: 15 }
    ];

    let totalGeneral = 0;

    for (const indicator of data.indicators) {
      const indicatorRecords = data.records.filter(r => r.indicator_id === indicator.id);
      const total = indicatorRecords.reduce((sum, r) => sum + parseFloat(r.value), 0);

      worksheet.addRow({
        indicator: indicator.name,
        total: total
      });

      totalGeneral += total;
    }

    // Adaugă rândul TOTAL
    worksheet.addRow({
      indicator: 'TOTAL',
      total: totalGeneral
    });

    // Bold pentru rândul TOTAL
    const lastRow = worksheet.lastRow;
    lastRow.font = { bold: true };

    worksheet.addRow({});
    worksheet.addRow({
      indicator: 'Data:',
      total: new Date().toLocaleString('ro-RO')
    });

    await workbook.xlsx.writeFile(fileName);
    return fileName;
  }

  // Generare PDF din HTML cu Handlebars și Puppeteer
  static async generateHtmlPdfReport(data, fileName, subdivisionName, periodName, description) {
    const templatePath = path.join(__dirname, '../templates/reportTemplate.hbs');
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(templateSource);

    let totalGeneral = 0;
    const indicators = data.indicators.map(indicator => {
      const indicatorRecords = data.records.filter(r => r.indicator_id === indicator.id);
      const total = indicatorRecords.reduce((sum, r) => sum + parseFloat(r.value), 0);
      totalGeneral += total;
      return { name: indicator.name, total };
    });

    const descArray = Array.isArray(description) ? description : (description ? [description] : []);

    const html = template({
      subdivisionName,
      periodName,
      indicators,
      totalGeneral,
      date: new Date().toLocaleString('ro-RO'),
      description: description || [],
    });

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({ path: fileName, format: 'A4', printBackground: true });
    await browser.close();

    return fileName;
  }

  // Metodă unificată pentru generare raport
  static async generateReport(subdivisionId, periodType, description) {
    try {
      // Determină perioada în funcție de tipul raportului
      let periodStart = new Date();
      let periodName = '';
      switch (periodType) {
        case 'weekly':
          periodStart.setDate(periodStart.getDate() - 7);
          periodName = 'săptămânal';
          break;
        case 'quarterly':
          periodStart.setMonth(periodStart.getMonth() - 3);
          periodName = 'trimestrial';
          break;
        case 'annual': 
          periodStart.setFullYear(periodStart.getFullYear() - 1);
          periodName = 'anual';
          break;
        default:
          throw new Error('Tip raport invalid');
      }

      
      // Obține datele
      const data = await this.getReportData(subdivisionId, periodStart);

      // Obține numele subdiviziunii
      const subdivisionQuery = await query(
        'SELECT name FROM subdivisions WHERE id = $1',
        [subdivisionId]
      );
      if (!subdivisionQuery.rows.length) {
        throw new Error('Subdiviziunea nu a fost găsită');
      }
      const subdivisionName = subdivisionQuery.rows[0].name;

      // Creează directorul pentru rapoarte dacă nu există
      const reportsDir = path.join(__dirname, '../../reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      // Generează numele fișierului folosind subdivisionName
      const baseFileName = `raport_${periodName}_${subdivisionName}_${new Date().toISOString().split('T')[0]}`.replace(/[^a-zA-Z0-9_-]/g, '_');
      const excelFile = path.join(reportsDir, `${baseFileName}.xlsx`);
      const pdfFile = path.join(reportsDir, `${baseFileName}.pdf`);

      await Promise.all([
        this.generateExcelReport(data, excelFile, subdivisionName),
        this.generateHtmlPdfReport(data, pdfFile, subdivisionName, periodName, description)
      ]);

      return {
        downloadUrls: {
          excel: `${baseFileName}.xlsx`,
          pdf: `${baseFileName}.pdf`
        },
        recordCount: data.records.length,
        indicatorsCount: data.indicators.length
      };
    } catch (error) {
      console.error('Eroare generare raport:', error);
      throw error;
    }
  }
}

module.exports = ReportService;