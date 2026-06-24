const mongoose = require('mongoose');

const mfCacheSchema = new mongoose.Schema({
  key: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  }, // e.g. "search_axis" or "scheme_120465"
  data: { 
    type: mongoose.Schema.Types.Mixed, 
    required: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

// TTL index to automatically purge cache documents after 12 hours (43200 seconds)
mfCacheSchema.index({ timestamp: 1 }, { expireAfterSeconds: 43200 });

module.exports = mongoose.model('MFCache', mfCacheSchema);
