const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Bulk sync tasks
router.post('/sync', async (req, res) => {
  try {
    const { tasks } = req.body;
    
    // Simple strategy: Clear and re-insert for sync consistency (or use upsert)
    // For a simple backup-style sync:
    for (const task of tasks) {
      await Task.findOneAndUpdate(
        { id: task.id },
        task,
        { upsert: true, new: true }
      );
    }
    
    res.json({ message: 'Sync successful', count: tasks.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete all tasks (Clear history)
router.delete('/clear', async (req, res) => {
  try {
    await Task.deleteMany({});
    res.json({ message: 'History cleared' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
