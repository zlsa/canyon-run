'use strict';

require('style/main');

var $ = require('jquery');

var instance = require('./instance');

$(document).ready(function() {
  window.img = document.createElement('img');

  img.onload = function() {
    window.ins = new instance.Instance();
    window.ins.start();
  };
  
  img.src = require('./images/textures/ground/normal.png');

});
