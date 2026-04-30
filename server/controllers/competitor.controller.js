const Competitor = require('../models/competitor.model');

// Get all competitors
exports.getAll = async (req, res) => {
  try {
    const competitors = await Competitor.find().sort({ createdAt: -1 });
    res.json(competitors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single competitor
exports.getById = async (req, res) => {
  try {
    const competitor = await Competitor.findById(req.params.id);
    if (!competitor) return res.status(404).json({ error: 'Competitor not found' });
    res.json(competitor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create competitor
exports.create = async (req, res) => {
  try {
    const competitor = await Competitor.create(req.body);
    res.status(201).json(competitor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update competitor
exports.update = async (req, res) => {
  try {
    const competitor = await Competitor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!competitor) return res.status(404).json({ error: 'Competitor not found' });
    res.json(competitor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete competitor
exports.remove = async (req, res) => {
  try {
    const competitor = await Competitor.findByIdAndDelete(req.params.id);
    if (!competitor) return res.status(404).json({ error: 'Competitor not found' });
    res.json({ message: 'Competitor deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
