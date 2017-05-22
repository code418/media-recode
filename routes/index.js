var express = require('express');
var router = express.Router();
var debug = require('debug')('media-recode:server');
var ffmpeg = require('fluent-ffmpeg');
var _ = require('lodash');
ffmpeg.getAvailableCodecs(function(err, codecs) {
  //debug('Available codecs:');
  //debug(codecs);
});


module.exports = function(Video){
  /* GET home page. */
  router.get('/', function(req, res, next) {
    Video.find().sort('path').then(function (videos) {
      res.render('index', { videos: videos });
    }).catch(function(error){
      res.send(error);
    });
  });

  router.get('/video/:videoId', function(req, res, next) {
    Video.findById(req.params.videoId).then(function (video) {
      ffmpeg(video.path).ffprobe(function(err, metadata) {
        video.videoTracks = [];
        video.audioTracks = [];
        _.each(metadata.streams, function(stream){
          debug(stream);
          var bitrate = Math.floor(stream.bit_rate / 1000);
          switch(stream.codec_type){
            case 'audio':
            video.audioTracks.push({id:stream.index, bitrate: bitrate});
            break;
            case 'video':
            video.videoTracks.push({id:stream.index, bitrate: bitrate});
            break;
          }
        });
        video.save();
      });
      Video.find().sort('path').then(function (videos) {
        res.render('video', { videos: videos, singlevideo: video });
      });
    }).catch(function(error){
      res.json({'status':'failure', 'err': error});
    });
  });

  router.post('/encode/:videoId', function(req, res, next) {
    Video.findById(req.params.videoId).then(function (video) {
      video.encode();
      res.redirect(301, '/video/'+video.id);
    }).catch(function(error){
      res.json({'status':'failure', 'err': error});
    });
  });
  return router;
}
