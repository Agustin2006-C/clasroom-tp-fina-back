const Performance = require('../models/Performance');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const User = require('../models/User');

const getTeacherPerformance = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { period = 'current' } = req.query;

    // Verificar que el usuario es director
    if (req.user.role !== 'director') {
      return res.status(403).json({
        success: false,
        message: 'Solo los directores pueden ver el desempeño de profesores'
      });
    }

    // Verificar que el profesor existe
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({
        success: false,
        message: 'Profesor no encontrado'
      });
    }

    let startDate, endDate;
    if (period === 'current') {
      // Últimos 30 días
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    } else {
      // Mes específico (formato: YYYY-MM)
      const [year, month] = period.split('-');
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0);
    }

    // Obtener estadísticas del profesor
    const assignments = await Assignment.find({
      teacher: teacherId,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const submissions = await Submission.find({
      assignment: { $in: assignments.map(a => a._id) }
    });

    const gradedSubmissions = submissions.filter(s => s.grade !== undefined);
    
    // Calcular tiempo promedio de calificación
    let averageGradingTime = 0;
    if (gradedSubmissions.length > 0) {
      const totalGradingTime = gradedSubmissions.reduce((total, submission) => {
        if (submission.gradedAt && submission.submittedAt) {
          return total + (submission.gradedAt - submission.submittedAt);
        }
        return total;
      }, 0);
      averageGradingTime = totalGradingTime / gradedSubmissions.length / (1000 * 60 * 60); // Convertir a horas
    }

    // Calificar calidad de feedback (simulada)
    const feedbackQuality = calculateFeedbackQuality(gradedSubmissions);

    const performanceData = {
      teacher: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email
      },
      period: {
        start: startDate,
        end: endDate
      },
      metrics: {
        assignmentsCreated: assignments.length,
        totalSubmissions: submissions.length,
        gradedSubmissions: gradedSubmissions.length,
        gradingRate: submissions.length > 0 ? (gradedSubmissions.length / submissions.length) * 100 : 0,
        averageGradingTime: Math.round(averageGradingTime * 100) / 100,
        feedbackQuality: Math.round(feedbackQuality * 100) / 100
      },
      assignments: assignments.map(assignment => ({
        id: assignment._id,
        title: assignment.title,
        dueDate: assignment.dueDate,
        submissions: submissions.filter(s => s.assignment.toString() === assignment._id.toString()).length
      }))
    };

    // Guardar o actualizar en la base de datos
    const performancePeriod = period === 'current' 
      ? `${endDate.getFullYear()}-${(endDate.getMonth() + 1).toString().padStart(2, '0')}`
      : period;

    await Performance.findOneAndUpdate(
      { teacher: teacherId, period: performancePeriod },
      {
        teacher: teacherId,
        period: performancePeriod,
        totalAssignments: assignments.length,
        gradedSubmissions: gradedSubmissions.length,
        averageGradingTime,
        metrics: performanceData.metrics
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      performance: performanceData
    });

  } catch (error) {
    console.error('Error obteniendo desempeño:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo desempeño del profesor',
      error: error.message
    });
  }
};

const getAllTeachersPerformance = async (req, res) => {
  try {
    if (req.user.role !== 'director') {
      return res.status(403).json({
        success: false,
        message: 'Solo los directores pueden ver el desempeño de profesores'
      });
    }

    const teachers = await User.find({ role: 'teacher', isActive: true });
    
    const performanceData = await Promise.all(
      teachers.map(async (teacher) => {
        const recentPerformance = await Performance.findOne({ 
          teacher: teacher._id 
        }).sort({ period: -1 });

        const assignmentsCount = await Assignment.countDocuments({ 
          teacher: teacher._id 
        });

        const submissionsCount = await Submission.countDocuments({
          assignment: { $in: await Assignment.find({ teacher: teacher._id }).distinct('_id') }
        });

        return {
          teacher: {
            id: teacher._id,
            name: teacher.name,
            email: teacher.email
          },
          overview: {
            totalAssignments: assignmentsCount,
            totalSubmissions: submissionsCount
          },
          recentPerformance: recentPerformance || null
        };
      })
    );

    res.json({
      success: true,
      teachers: performanceData
    });

  } catch (error) {
    console.error('Error obteniendo desempeño de todos los profesores:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo desempeño de profesores',
      error: error.message
    });
  }
};

// Función auxiliar para calcular calidad de feedback (simulada)
function calculateFeedbackQuality(submissions) {
  if (submissions.length === 0) return 0;

  let totalScore = 0;
  
  submissions.forEach(submission => {
    let score = 2; // Puntuación base
    
    // Bonus por feedback largo
    if (submission.feedback && submission.feedback.length > 50) {
      score += 1;
    }
    
    // Bonus por feedback muy detallado
    if (submission.feedback && submission.feedback.length > 100) {
      score += 1;
    }
    
    // Bonus por calificación con decimales (indica más precisión)
    if (submission.grade % 1 !== 0) {
      score += 1;
    }
    
    totalScore += Math.min(score, 5); // Máximo 5 puntos
  });

  return totalScore / submissions.length;
}

module.exports = {
  getTeacherPerformance,
  getAllTeachersPerformance
};