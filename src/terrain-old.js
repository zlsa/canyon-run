'use strict';

var util = require('./util');

var $ = require('jquery');

var C = require('cannon');
var T = require('three');
var events = require('./events');

var Noise = require('noisejs').Noise;

class Tile extends events.Events {

  constructor(manager, position) {
    super();

    this.manager = manager;
  }

}

class Manager extends events.Events {

  constructor(instance) {
    super();

    this.instance = instance;

    this.viewer = new T.Vector3();

    this.noise = new Noise(Math.random());

    this.tile = new Tile();

  }

  setViewer(viewer) {
    if(!this.ready) return;
    var distance = this.viewer.distanceTo(viewer);
    if(distance < this.fuzz) return;

    this.viewer.copy(viewer);

    this.updateVisibility();
  }
  tick(elapsed) {
  }
  
}

exports.Manager = Manager;
