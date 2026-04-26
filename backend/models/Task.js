const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  id: { type: String, required: true },
  subject: { type: String, required: true },
  topic: { type: String },
  plannedStart: { type: String },
  plannedEnd: { type: String },
  actualStart: { type: String },
  actualEnd: { type: String },
  duration: { type: Number },
  status: { type: String, enum: ['pending', 'running', 'completed', 'missed'], default: 'pending' },
  goal: { type: String },
  isDaily: { type: Boolean, default: false },
  historyDate: { type: String }, // To store which day this task belonged to
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
