const mongoose = require('mongoose');

const competitorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Competitor name is required'],
      trim: true,
    },
    source_url: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Competitor', competitorSchema);
