const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');

// En controllers/submissionController.js - actualizar submitAssignment
const submitAssignment = async (req, res) => {
  try {
    const { assignmentId, comment } = req.body;

    // Verificar que la tarea existe
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    // Verificar que no esté vencida
    if (new Date() > assignment.dueDate) {
      return res.status(400).json({
        success: false,
        message: 'La tarea está vencida y no se puede entregar'
      });
    }

    // Verificar que el estudiante no haya entregado ya esta tarea
    const existingSubmission = await Submission.findOne({
      assignment: assignmentId,
      student: req.user._id
    });

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'Ya has entregado esta tarea'
      });
    }

    // Procesar archivos subidos
    const files = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        files.push({
          filename: file.originalname,
          url: `/uploads/${file.filename}`, // Ruta relativa para acceder al archivo
          filepath: file.path, // Ruta completa en el servidor
          size: file.size,
          mimetype: file.mimetype
        });
      });
    }

    // Crear nueva entrega
    const submission = new Submission({
      assignment: assignmentId,
      student: req.user._id,
      comment,
      files: files
    });

    await submission.save();
    
    // Poblar los datos relacionados
    await submission.populate('assignment', 'title dueDate maxPoints');
    await submission.populate('student', 'name email');

    res.status(201).json({
      success: true,
      message: files.length > 0 
        ? `Tarea entregada exitosamente con ${files.length} archivo(s)`
        : 'Tarea entregada exitosamente',
      submission
    });

  } catch (error) {
    console.error('Error entregando tarea:', error);
    
    // Limpiar archivos subidos si hay error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const fs = require('fs');
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error entregando tarea',
      error: error.message
    });
  }
};

module.exports = {
  submitAssignment,
  getStudentSubmissions,
  getAssignmentSubmissions,
  gradeSubmission,
  getSubmissionById
};