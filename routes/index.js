var express = require('express');
var router = express.Router();
var debug = require('debug')('media-recode:server');
var ffmpeg = require('fluent-ffmpeg');
var Video = require('../models/Video');

/* GET home page. */
router.get('/', function(req, res, next) {
  Video.find().sort('updatedAt').then(function (videos) {
    res.render('index', { videos: videos });
  }).catch(function(error){
    res.send(error);
  });
});

router.get('/video/:videoId', function(req, res, next) {
  Video.findById(req.params.videoId).then(function (video) {
    ffmpeg(video.path).ffprobe(function(err, metadata) {
      debug(metadata);
    });
    res.render('video', { video: video });
  }).catch(function(error){
    res.json({'status':'failure', 'err': error});
  });
});

module.exports = router;
