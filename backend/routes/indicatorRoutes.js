// routes/indicatorRoutes.js
const express = require('express');
const router = express.Router();
const indicatorController = require('../controllers/indicatorController')
const authMiddleware = require('../middlewares/authMiddleware');
const e = require('express');

// Public routes
router.get('/', indicatorController.getIndicators);
router.get('/subdivision/:subdivisionId', indicatorController.getIndicatorsBySubdivision);

// Protected routes
router.post('/records', authMiddleware.authenticate, indicatorController.saveIndicatorRecords);
router.get('/records/:subdivisionId', authMiddleware.authenticate, indicatorController.getSubdivisionRecords);


router.post('/', 
  authMiddleware.authenticate, 
  indicatorController.createIndicator
);

router.put('/:id', 
  authMiddleware.authenticate,
  indicatorController.updateIndicator
);

router.delete('/:id', 
  authMiddleware.authenticate, 
  authMiddleware.authorize('user'), 
  indicatorController.deleteIndicator
);



module.exports = router;
