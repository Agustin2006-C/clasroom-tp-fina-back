const express = require('express');
const { body } = require('express-validator');
const {
  submitAssignment,
  getStudentSubmissions,
  getAssignmentSubmissions,
  gradeSubmission,
  getSubmissionById
} = require('../controllers/submissionController');
const { auth, requireRole } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { upload, handleUploadErrors } = require('../middleware/upload'); // Cambio aquí

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(auth);

// Validaciones
const submissionValidation = [
  body('assignmentId')
    .isMongoId()
    .withMessage('ID de tarea inválido'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('El comentario no puede tener más de 500 caracteres')
];

const gradeValidation = [
  body('grade')
    .isFloat({ min: 0 })
    .withMessage('La calificación debe ser un número positivo'),
  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('El feedback no puede tener más de 1000 caracteres')
];

// Rutas para estudiantes
router.post('/', 
  requireRole(['student']), 
  upload.array('files', 5), // Máximo 5 archivos
  handleUploadErrors, // Manejar errores de subida
  submissionValidation, 
  handleValidationErrors, 
  submitAssignment
);

// ... resto de las rutas