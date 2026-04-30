const Training = require('../models/training.model');

// Get all trainings (with competitor data populated)
exports.getAll = async (req, res) => {
  try {
    const trainings = await Training.find()
      .populate('competitor_id', 'name category')
      .sort({ createdAt: -1 });
    res.json(trainings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single training
exports.getById = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id).populate('competitor_id', 'name category');
    if (!training) return res.status(404).json({ error: 'Training not found' });
    res.json(training);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create training
exports.create = async (req, res) => {
  try {
    const training = await Training.create(req.body);
    const populated = await training.populate('competitor_id', 'name category');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update training
exports.update = async (req, res) => {
  try {
    const training = await Training.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('competitor_id', 'name category');
    if (!training) return res.status(404).json({ error: 'Training not found' });
    res.json(training);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete training
exports.remove = async (req, res) => {
  try {
    const training = await Training.findByIdAndDelete(req.params.id);
    if (!training) return res.status(404).json({ error: 'Training not found' });
    res.json({ message: 'Training deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
