// server/models/TripPhoto.js
const mongoose = require('mongoose');

const tripPhotoSchema = new mongoose.Schema({
  group:       { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  uploadedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedByName: { type: String, default: null },

  // Storage
  cloudinaryUrl:      { type: String, required: true },
  cloudinaryPublicId: { type: String },
  fileName:           { type: String },
  originalName:       { type: String },
  fileSize:           { type: Number }, // bytes
  mimeType:           { type: String },
  width:              { type: Number },
  height:             { type: Number },

  // Google Drive sync
  driveFileId:   { type: String, default: null },
  driveFileLink: { type: String, default: null },
  driveSynced:   { type: Boolean, default: false },

  // AI Quality Analysis
  aiQualityScore:  { type: Number, default: null }, // 0-100
  aiQualityLabel:  { type: String, enum: ['excellent', 'good', 'average', 'poor', 'blurry', null], default: null },
  aiTags:          [{ type: String }],       // e.g. ['outdoor', 'group', 'food', 'landscape']
  aiDescription:   { type: String },         // short AI caption
  isBlurry:        { type: Boolean, default: false },
  isBestPhoto:     { type: Boolean, default: false }, // AI-selected best

  // Votes
  votes: [{
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    votedAt: { type: Date, default: Date.now }
  }],
  voteCount: { type: Number, default: 0 },

  reactions: [{
    user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji:     { type: String, enum: ['❤️', '😂', '🔥'] },
    reactedAt: { type: Date, default: Date.now }
  }],

  // Caption
  caption:   { type: String },
  isDeleted: { type: Boolean, default: false },
  comments: [{
    userName:  { type: String, required: true },
    text:      { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Virtuals for seamless frontend compatibility
tripPhotoSchema.virtual('url').get(function() {
  return this.cloudinaryUrl;
});
tripPhotoSchema.virtual('isBest').get(function() {
  return this.isBestPhoto;
});
tripPhotoSchema.virtual('aiFeedback').get(function() {
  return this.aiDescription || 'Good standard photo.';
});
tripPhotoSchema.virtual('googleDriveFileId').get(function() {
  return this.driveFileId;
});

// Configure serialization to include virtuals
tripPhotoSchema.set('toJSON', { virtuals: true });
tripPhotoSchema.set('toObject', { virtuals: true });

// Index for fast group queries
tripPhotoSchema.index({ group: 1, createdAt: -1 });
tripPhotoSchema.index({ group: 1, aiQualityScore: -1 });
tripPhotoSchema.index({ group: 1, isBestPhoto: -1 });

module.exports = mongoose.model('TripPhoto', tripPhotoSchema);

