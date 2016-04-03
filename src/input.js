'use strict';

var util = require('./util');

var $ = require('jquery');

var T = require('three');

var K = {
  A: 65,
  B: 66,
  C: 67,
  D: 68,
  E: 69,
  F: 70,
  G: 71,
  H: 72,
  I: 73,
  J: 74,
  K: 75,
  L: 76,
  M: 77,
  N: 78,
  O: 79,
  P: 80,
  Q: 81,
  R: 82,
  S: 83,
  T: 84,
  U: 85,
  V: 86,
  W: 87,
  X: 88,
  Y: 89,
  Z: 90,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  SHIFT: 16,
  CONTROL: 17,
  LEFT_SQUARE_BRACKET: 219,
  RIGHT_SQUARE_BRACKET: 221,
  COMMA: 188,
  PERIOD: 190,
  PGUP: 33,
  PGDN: 34
};

class Input {

  constructor(instance) {
    $(window).keydown(util.with_scope(this, this.keydown));
    $(window).keyup(util.with_scope(this, this.keyup));

    this.keys = {};

    this.key = {
      translate: {
        left: K.A,
        right: K.D,
        up: K.W,
        down: K.S,
        forwards: K.E,
        backwards: K.Q
      },
      rotate: {
        yaw_left: K.LEFT,
        yaw_right: K.RIGHT,
        pitch_up: K.UP,
        pitch_down: K.DOWN,
        roll_right: K.PGDN,
        roll_left: K.PGUP
      }
    };

    this.translate = new T.Vector3();
    this.rotate = new T.Vector3();
  }

  keydown(e) {
    this.keys[e.which] = true;
  }
  
  keyup(e) {
    this.keys[e.which] = false;
  }

  update() {
    if(this.keys[this.key.translate.left]) {
      this.translate.x = -1;
    } else if(this.keys[this.key.translate.right]) {
      this.translate.x = 1;
    } else {
      this.translate.x = 0;
    }
    
    if(this.keys[this.key.translate.up]) {
      this.translate.z = -1;
    } else if(this.keys[this.key.translate.down]) {
      this.translate.z = 1;
    } else {
      this.translate.z = 0;
    }

    if(this.keys[this.key.translate.forwards]) {
      this.translate.y = 1;
    } else if(this.keys[this.key.translate.backwards]) {
      this.translate.y = -1;
    } else {
      this.translate.y = 0;
    }
    
    if(this.keys[this.key.rotate.yaw_left]) {
      this.rotate.z = -1;
    } else if(this.keys[this.key.rotate.yaw_right]) {
      this.rotate.z = 1;
    } else {
      this.rotate.z = 0;
    }
    
    if(this.keys[this.key.rotate.pitch_up]) {
      this.rotate.x = -1;
    } else if(this.keys[this.key.rotate.pitch_down]) {
      this.rotate.x = 1;
    } else {
      this.rotate.x = 0;
    }

    if(this.keys[this.key.rotate.roll_left]) {
      this.rotate.y = -1;
    } else if(this.keys[this.key.rotate.roll_right]) {
      this.rotate.y = 1;
    } else {
      this.rotate.y = 0;
    }
    
  }

  apply() {
    this.update();
  }
  
}

exports.Input = Input;
