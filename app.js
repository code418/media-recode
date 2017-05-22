require('dotenv').config();
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var sassMiddleware = require('node-sass-middleware');
var debug = require('debug')('media-recode:server');
var queue = require('queue');
var _ = require('lodash');
var q = queue();
var Video = require('./models/Video')(q);
var index = require('./routes/index')(Video);
q.concurrency = 1;
q.autostart = true;
q.on('success', function(result,job){
  debug('job start');
});
q.on('error', function(error,job){
  debug('job error');
});
q.on('timeout', function(con,job){
  debug('job timeout');
});
q.on('end', function(result,job){
  debug('job end');
});


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(sassMiddleware({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: true, // true = .sass and false = .scss
  sourceMap: true
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/mediarecode');


var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  debug('connected to db');
});


var Glob = require("glob").Glob;

var crypto = require('crypto')
var fs = require('fs');

var initialScan = new Glob(process.env.SCAN_DIR);
debug('scanning');
Video.find().sort('path').then(function (videos) {
  _.each(videos, function(video){
    debug(video.path);
    if (!fs.existsSync(video.path)) {
        video.remove();
    }
  })
});
initialScan.on('match', function(path){
  q.push(function(cb) {
    Video.find({path:path}).then(function (videos) {
      if(videos.length === 0){
        var newVideo = new Video({path:path});
            newVideo.save().then(function (video) {
              debug(video);
            });
      }
    });
    cb();
  /*
  var hash = crypto.createHash('md5');
  var stream = fs.createReadStream(path);
  debug('match '+ path);
  stream.on('data', function (data) {
      hash.update(data, 'utf8');
  })

  stream.on('end', function () {
      var finalMd5 = hash.digest('hex');
      debug(finalMd5);
      Video.find({identifier:finalMd5, path:path}).then(function (videos) {
        if(videos.length === 0){
          var newVideo = new Video({identifier:finalMd5, path:path});
              newVideo.save().then(function (video) {
                debug(video);
              });
        }
      });
      cb();
  })
  */
});
});

module.exports = app;
