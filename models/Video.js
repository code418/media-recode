var mongoose = require("mongoose");
var ffmpeg = require('fluent-ffmpeg');

var videoSchema = mongoose.Schema({
  path: String,
  identifier: String,
}, {
  timestamps: true
});

module.exports = mongoose.model('Video', videoSchema);
