const express = require('express');
const { body } = require('express-validator');
const { register, login, getProfile } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Validaciones para registro
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Por favor ingresa un email válido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('role')
    .optional()
    .isIn(['student', 'teacher', 'director'])
    .withMessage('Rol inválido')
];

// Validaciones para login
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Por favor ingresa un email válido'),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
];

// Rutas públicas
router.post('/register', registerValidation, handleValidationErrors, register);
router.post('/login', loginValidation, handleValidationErrors, login);

// Ruta protegida
router.get('/profile', auth, getProfile);

module.exports = router;