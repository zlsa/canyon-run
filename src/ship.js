'use strict';

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
      position: new C.Vec3(0, 0, 1000),
      shape: new C.Sphere(5),
      angularDamping: 0.9
    });
    
    this.world.world.addBody(this.body);

    this.object = new T.Object3D();

    this.camera = new T.PerspectiveCamera(55, 1, 1, 10000 * 1000);
    this.camera.up = new T.Vector3(0, 0, 1);
    this.camera.lookAt(new T.Vector3(0, 1, 0));

    this.object.add(this.camera);

    this.scene.scene.add(this.object);

    this.input = new input.Input();

    this.temp = {
      v3a: new C.Vec3(),
      v3b: new C.Vec3()
    };
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
  }
  
}

exports.Ship = Ship;
