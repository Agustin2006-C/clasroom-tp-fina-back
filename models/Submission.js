const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  files: [{
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comment: {
    type: String,
    trim: true,
    maxlength: [500, 'El comentario no puede tener más de 500 caracteres']
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  grade: {
    type: Number,
    min: 0,
    max: 10,
    validate: {
      validator: Number.isInteger,
      message: 'La calificación debe ser un número entero'
    }
  },
  feedback: {
    type: String,
    trim: true,
    maxlength: [1000, 'El feedback no puede tener más de 1000 caracteres']
  },
  gradedAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['submitted', 'graded', 'late'],
    default: 'submitted'
  }
});

// Índice único para evitar entregas duplicadas
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

// Índices para búsquedas frecuentes
submissionSchema.index({ student: 1, submittedAt: -1 });
submissionSchema.index({ assignment: 1, status: 1 });

// Middleware para establecer status como 'late' si se entrega después de dueDate
submissionSchema.pre('save', async function(next) {
  if (this.isModified('submittedAt') || this.isNew) {
    const assignment = await mongoose.model('Assignment').findById(this.assignment);
    if (assignment && this.submittedAt > assignment.dueDate) {
      this.status = 'late';
    }
  }
  next();
});

module.exports = mongoose.model('Submission', submissionSchema);