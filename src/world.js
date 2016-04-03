'use strict';

var $ = require('jquery');
var C = require('cannon');

class World {

  constructor() {
    this.world = new C.World();
    this.world.gravity.set(0, 0, -9.82);
  }

  tick(elapsed) {
    this.world.step(elapsed);
  }
  
}

exports.World = World;
