var mongoose = require("mongoose");
var ffmpeg = require('fluent-ffmpeg');
var debug = require('debug')('media-recode:server');
var replaceExt = require('replace-ext');
var _ = require('lodash');
module.exports = function(q){
  var videoSchema = mongoose.Schema({
    path: String,
    identifier: String,
    videoTracks: [{ id: Number, bitrate: Number, selected: { type: Boolean, default: true } }],
    audioTracks: [{ id: Number, bitrate: Number, language: String, selected: { type: Boolean, default: true } }],
    locked: Boolean,
    progress: Number,
  }, {
    timestamps: true
  });

  videoSchema.methods.encode = function() {
    var video = this;
    video.locked = true;
    video.save();
    var commands = [];
    var videoBitrate = 0;
    var audioBitrate = 0;
    _.each(video.videoTracks, function(track){
      if(track.selected){
        if(track.bitrate > videoBitrate){
          videoBitrate = track.bitrate;
        }
        commands.push('-map 0:'+track.id)
      }
    });
    _.each(video.audioTracks, function(track){
      if(track.selected){
        if(track.bitrate > audioBitrate){
          audioBitrate = track.bitrate;
        }
        commands.push('-map 0:'+track.id)
      }
    });
    q.push(function(cb) {
      ffmpeg(video.path)
      .outputOptions(commands)
      .videoBitrate(videoBitrate)
      .audioBitrate(audioBitrate)
      .videoCodec('libx264')
      .audioCodec('libfdk_aac')
      .on('error', function(err) {
        debug('An error occurred: ' + err.message);
        video.locked = false;
        video.save();
        cb();
      })
      .on('progress', function(progress){
        debug('Processing: ' + progress.percent + '% done');
        video.progress = progress.percent;
        video.save();
      })
      .on('end', function() {
        debug('Processing finished !');
        video.locked = false;
        video.save();
        cb();
      })
      .save(replaceExt(video.path, '.mp4'));

    });
  };

  return mongoose.model('Video', videoSchema);
}
