const express = require('express');
const { body } = require('express-validator');
const {
  createAssignment,
  getAssignments,
  getTeacherAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment
} = require('../controllers/assignmentController');
const { auth, requireRole } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(auth);

// Validaciones para crear/actualizar tareas
const assignmentValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('El título debe tener entre 5 y 200 caracteres'),
  body('description')
    .trim()
    .isLength({ min: 10 })
    .withMessage('La descripción debe tener al menos 10 caracteres'),
  body('dueDate')
    .isISO8601()
    .withMessage('La fecha de entrega debe ser una fecha válida')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('La fecha de entrega debe ser futura');
      }
      return true;
    }),
  body('maxPoints')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Los puntos máximos deben estar entre 1 y 100')
];

// Rutas para estudiantes y profesores
router.get('/', getAssignments); // Todos pueden ver las tareas

// Rutas solo para profesores
router.post('/', 
  requireRole(['teacher']), 
  assignmentValidation, 
  handleValidationErrors, 
  createAssignment
);

router.get('/teacher', 
  requireRole(['teacher']), 
  getTeacherAssignments
);

router.get('/:id', getAssignmentById);

router.put('/:id', 
  requireRole(['teacher']), 
  assignmentValidation, 
  handleValidationErrors, 
  updateAssignment
);

router.delete('/:id', 
  requireRole(['teacher']), 
  deleteAssignment
);

module.exports = router;