var express = require('express');
var router = express.Router();

/* GET sync listing. */
router.get('/', function(req, res, next) {
  res.send('Syncing');
});

module.exports = router;
