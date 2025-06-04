const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// Autentificare
router.post('/login', authController.login);

// Informații utilizator curent (necesită autentificare)
router.get('/me', authMiddleware.authenticate, authController.getMe);

module.exports = router;