const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'El título es requerido'],
    trim: true,
    maxlength: [200, 'El título no puede tener más de 200 caracteres']
  },
  description: {
    type: String,
    required: [true, 'La descripción es requerida'],
    trim: true
  },
  instructions: {
    type: String,
    trim: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dueDate: {
    type: Date,
    required: [true, 'La fecha de entrega es requerida']
  },
  maxPoints: {
    type: Number,
    default: 10,
    min: 1,
    max: 100
  },
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPublished: {
    type: Boolean,
    default: true
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

// Índices para mejor performance
assignmentSchema.index({ teacher: 1, createdAt: -1 });
assignmentSchema.index({ dueDate: 1 });

// Middleware para actualizar updatedAt
assignmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual para saber si la tarea está vencida
assignmentSchema.virtual('isOverdue').get(function() {
  return new Date() > this.dueDate;
});

// Incluir virtuals en JSON
assignmentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Assignment', assignmentSchema);