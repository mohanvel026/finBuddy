// server/models/Photo.js
const mongoose = require('mongoose');

const PhotoSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  url: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  isBest: {
    type: Boolean,
    default: false
  },
  aiQualityScore: {
    type: Number,
    default: 100
  },
  aiFeedback: {
    type: String
  },
  googleDriveFileId: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Photo', PhotoSchema);
