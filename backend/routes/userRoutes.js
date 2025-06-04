const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const pool = require('../db');

router.get('/me', authMiddleware.authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, role FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilizatorul nu a fost găsit' });
    }
    res.status(200).json({ data: result.rows[0] });
  } catch (err) {
    console.error('Eroare:', err);
    res.status(500).json({ error: 'Eroare la obținerea datelor' });
  }
});


// Rute pentru administrare utilizatori (necesită autentificare și drepturi de admin)
router.use(authMiddleware.authenticate, authMiddleware.authorize('admin'));

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);


module.exports = router;