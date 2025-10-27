const express = require('express');
const { body } = require('express-validator');
const {
  getUsers,
  getUserById,
  updateUser,
  deactivateUser
} = require('../controllers/userController');
const { auth, requireRole } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(auth);

// Validaciones para actualizar usuario
const updateUserValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Por favor ingresa un email válido')
];

// Rutas
router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUserValidation, handleValidationErrors, updateUser);
router.delete('/:id', requireRole(['director']), deactivateUser);

module.exports = router;