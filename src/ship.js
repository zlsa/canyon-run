'use strict';

var $ = require('jquery');

var C = require('cannon');
var T = require('three');

var input = require('./input');

class Ship {

  constructor(instance) {

    this.instance = instance;

    this.scene = instance.scene;
    this.world = instance.world;
    
    this.body = new C.Body({
      mass: 5000,
      shape: new C.Sphere(5),
      angularDamping: 0.9
    });
    
    this.body.position.set(0, 0, 30000);
    
    this.world.world.addBody(this.body);

    this.object = new T.Object3D();

    this.camera = new T.PerspectiveCamera(55, 1, 10, 10000 * 1000);
    this.camera.up = new T.Vector3(0, 0, 1);
    this.camera.lookAt(new T.Vector3(0, 1, 0));

    this.object.add(this.camera);

    this.scene.scene.add(this.object);

    this.input = new input.Input();

    this.temp = {
      v3a: new C.Vec3(),
      v3b: new C.Vec3()
    };
    
    $('body').append('<ul id="info"></ul>');

    var stats = {
      'speed': 'SPD',
      'altitude': 'ALT',
      'agl': 'AGL'
    };

    for(var i in stats) {
      $('#info').append('<li id="stat-' + i + '">' + stats[i] + ': <span class="value"></span></li>');
    }
  }

  setInfo(stat, value, unit, fixed) {
    if(fixed == 0)
      value = Math.round(value);
    else
      value = value.toFixed(fixed);
    $('#info #stat-' + stat + ' .value').text(value + unit);
  }

  updateInput(elapsed) {
    this.input.apply();
    
    var fac = 50000;

    this.temp.v3a.copy(this.input.translate);
    this.temp.v3a.x *= fac * 5;
    this.temp.v3a.y *= fac * 8;
    this.temp.v3a.z *= fac * 10;

    this.body.applyLocalForce(this.temp.v3a, {x: 0, y:0, z: 0});

    fac *= 0.3;
    
    this.temp.v3a.setZero();

    this.temp.v3a.z = this.input.rotate.x * fac;
    this.temp.v3a.x = this.input.rotate.z * fac;

    this.temp.v3b.set(0, 10, 0);
    this.body.applyLocalForce(this.temp.v3a, this.temp.v3b);

    this.temp.v3a.negate(this.temp.v3a);
    
    this.temp.v3b.set(0, -10, 0);
    this.body.applyLocalForce(this.temp.v3a, this.temp.v3b);

    this.temp.v3a.setZero();
    this.temp.v3a.x = this.input.rotate.y * fac;
    
    this.temp.v3b.set(0, 0, 10);
    this.body.applyLocalForce(this.temp.v3a, this.temp.v3b);

    this.temp.v3a.negate(this.temp.v3a);
    
    this.temp.v3b.set(0, 0, -10);
    this.body.applyLocalForce(this.temp.v3a, this.temp.v3b);

  }

  updateMesh(elapsed) {
    this.object.position.copy(this.body.position);

    this.object.quaternion.copy(this.body.quaternion);

    this.setInfo('speed', this.body.velocity.length(), 'm/s');
    this.setInfo('altitude', this.body.position.z * 0.001, 'km', 1);
    this.setInfo('agl', this.body.position.z - this.instance.terrain.getAltitude([this.body.position.x, this.body.position.y]), 'm', 2);
  }
  
}

exports.Ship = Ship;
