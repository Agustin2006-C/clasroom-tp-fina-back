const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');

const createAssignment = async (req, res) => {
  try {
    const { title, description, instructions, dueDate, maxPoints } = req.body;

    const assignment = new Assignment({
      title,
      description,
      instructions,
      dueDate,
      maxPoints: maxPoints || 10,
      teacher: req.user._id
    });

    await assignment.save();
    await assignment.populate('teacher', 'name email');

    res.status(201).json({
      success: true,
      message: 'Tarea creada exitosamente',
      assignment
    });

  } catch (error) {
    console.error('Error creando tarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando tarea',
      error: error.message
    });
  }
};

const getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ isPublished: true })
      .populate('teacher', 'name email')
      .sort({ dueDate: 1 });

    // Para estudiantes, verificar estado de entrega
    if (req.user.role === 'student') {
      const assignmentsWithStatus = await Promise.all(
        assignments.map(async (assignment) => {
          const submission = await Submission.findOne({
            assignment: assignment._id,
            student: req.user._id
          });
          
          const assignmentObj = assignment.toObject();
          assignmentObj.submitted = !!submission;
          assignmentObj.submission = submission;
          
          return assignmentObj;
        })
      );

      return res.json({
        success: true,
        assignments: assignmentsWithStatus
      });
    }

    res.json({
      success: true,
      assignments
    });

  } catch (error) {
    console.error('Error obteniendo tareas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo tareas',
      error: error.message
    });
  }
};

const getTeacherAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ teacher: req.user._id })
      .populate({
        path: 'submissions',
        populate: {
          path: 'student',
          select: 'name email'
        }
      })
      .sort({ createdAt: -1 });

    // Obtener estadísticas de cada tarea
    const assignmentsWithStats = await Promise.all(
      assignments.map(async (assignment) => {
        const submissions = await Submission.find({ 
          assignment: assignment._id 
        });
        
        const graded = submissions.filter(s => s.grade !== undefined).length;
        const total = submissions.length;
        
        const assignmentObj = assignment.toObject();
        assignmentObj.stats = {
          totalSubmissions: total,
          gradedSubmissions: graded,
          pendingSubmissions: total - graded
        };
        
        return assignmentObj;
      })
    );

    res.json({
      success: true,
      assignments: assignmentsWithStats
    });

  } catch (error) {
    console.error('Error obteniendo tareas del profesor:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo tareas',
      error: error.message
    });
  }
};

const getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('teacher', 'name email');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    res.json({
      success: true,
      assignment
    });

  } catch (error) {
    console.error('Error obteniendo tarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo tarea',
      error: error.message
    });
  }
};

const updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    // Verificar que el profesor es el dueño de la tarea
    if (assignment.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para editar esta tarea'
      });
    }

    const updatedAssignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('teacher', 'name email');

    res.json({
      success: true,
      message: 'Tarea actualizada exitosamente',
      assignment: updatedAssignment
    });

  } catch (error) {
    console.error('Error actualizando tarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando tarea',
      error: error.message
    });
  }
};

const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    // Verificar que el profesor es el dueño de la tarea
    if (assignment.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta tarea'
      });
    }

    await Assignment.findByIdAndDelete(req.params.id);

    // También eliminar todas las entregas asociadas
    await Submission.deleteMany({ assignment: req.params.id });

    res.json({
      success: true,
      message: 'Tarea eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando tarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando tarea',
      error: error.message
    });
  }
};

module.exports = {
  createAssignment,
  getAssignments,
  getTeacherAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment
};