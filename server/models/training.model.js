const mongoose = require('mongoose');

const trainingSchema = new mongoose.Schema(
  {
    competitor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Competitor',
      required: [true, 'Competitor ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Training title is required'],
      trim: true,
    },
    price: {
      type: Number,
      default: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    audience: {
      type: String,
      trim: true,
      default: 'General',
    },
    delivery_mode: {
      type: String,
      enum: ['Online', 'In-Person', 'Hybrid'],
      default: 'Online',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Training', trainingSchema);
