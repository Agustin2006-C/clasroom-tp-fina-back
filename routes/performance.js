const express = require('express');
const {
  getTeacherPerformance,
  getAllTeachersPerformance
} = require('../controllers/performanceController');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación y rol de director
router.use(auth);
router.use(requireRole(['director']));

router.get('/teachers', getAllTeachersPerformance);
router.get('/teacher/:teacherId', getTeacherPerformance);

module.exports = router;