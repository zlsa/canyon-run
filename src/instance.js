'use strict';

var $ = require('jquery');

var world = require('./world');
var ship = require('./ship');
var scene = require('./scene');
var terrain = require('./terrain');

class Instance {

  constructor() {
    this.world = new world.World(this);
    this.scene = new scene.Scene(this);
    
    this.ship = new ship.Ship(this);
    
    this.terrain = new terrain.Manager(this);
  }

  tick() {
    this.time.now = Date.now() * 0.001;

    this.time.elapsed = this.time.now - this.time.last;

    this.ship.updateInput(this.time.elapsed);
    this.world.tick(this.time.elapsed);
    this.ship.updateMesh(this.time.elapsed);
    this.scene.render(this.time.elapsed);

    this.time.last = this.time.now;

    var _this = this;
    
    this.time.fps = 1 / this.time.elapsed;

    $('#fps').text(this.time.fps.toFixed(1));
      
    this.terrain.setViewer(this.ship.object.position);

    this.terrain.tick(this.time.elapsed);

    requestAnimationFrame(function() {
      _this.tick.call(_this);
    });

  }

  start() {
    this.time = {
      last: Date.now() * 0.001,
      now: Date.now() * 0.001,
      elapsed: 0.01,
      fps: 0
    };

    $('body').append('<div id="fps"></div>');

    this.tick();
  }
  
}

exports.Instance = Instance;
