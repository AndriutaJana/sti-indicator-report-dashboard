const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware');

// Generare raport săptămânal (necesită autentificare)
router.post('/weekly', authMiddleware.authenticate, reportController.generateWeeklyReport);

// Generare raport trimestrial (necesită autentificare)
router.post('/quarterly', authMiddleware.authenticate, reportController.generateQuarterlyReport);

// Generare raport anual (necesită autentificare)
router.post('/annual', authMiddleware.authenticate, reportController.generateAnnualReport);

// Listare rapoarte (necesită autentificare)
router.get('/', authMiddleware.authenticate, reportController.listReports);

// Descărcare raport (necesită autentificare)
router.get('/download/:fileName', authMiddleware.authenticate, reportController.downloadReport);

module.exports = router;
