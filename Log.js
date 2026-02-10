const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  timestamp: { type: Date, required: true },
  service_name: { type: String, required: true, index: true },
  log_level: { type: String, required: true, index: true },
  message: { type: String, required: true },
  server_id: { type: String, required: true, index: true },
  trace_id: { type: String, index: true },
  meta: { type: mongoose.Schema.Types.Mixed }
}, { strict: false });

LogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('Log', LogSchema);
