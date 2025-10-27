const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  period: {
    type: String, // "2024-01", "2024-02", etc.
    required: true
  },
  totalAssignments: {
    type: Number,
    default: 0
  },
  gradedSubmissions: {
    type: Number,
    default: 0
  },
  averageGradingTime: {
    type: Number, // en horas
    default: 0
  },
  studentSatisfaction: {
    type: Number, // 1-5
    min: 1,
    max: 5
  },
  metrics: {
    assignmentsCreated: Number,
    submissionsGraded: Number,
    averageGrade: Number,
    feedbackQuality: Number // 1-5
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Índice único por profesor y período
performanceSchema.index({ teacher: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('Performance', performanceSchema);