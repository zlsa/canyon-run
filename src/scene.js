'use strict';

var $ = require('jquery');

var T = require('three');

class Scene {

  constructor(instance) {
    this.instance = instance;
    
    this.scene = new T.Scene();

    this.fog = new T.Fog(0x0, 0, 10000 * 1000);
    this.scene.fog = this.fog;
    
    this.renderer = new T.WebGLRenderer({
      antialias: true,
      logarithmicDepthBuffer: true
    });

    this.renderer.sortObjects = false;
    
    this.renderer.setSize(1, 1);
    $('body').append(this.renderer.domElement);

    var _this = this;
    
    $(window).resize(function(e) {
      _this.resize.apply(_this);
    });

    this.resize();

    this.sun = new T.DirectionalLight(0xffffff, 1);
    this.sun.position.set(0.5, 0.5, 1);

    this.scene.add(this.sun);
  }

  activeCamera() {
    return this.instance.ship.camera;
  }

  resize() {
    var width = $(window).width();
    var height = $(window).height();
    this.renderer.setSize(width, height);

    this.size = [width, height];
  }

  render(elapsed) {
    var c = this.activeCamera();
    
    c.aspect = this.size[0] / this.size[1];
    c.updateProjectionMatrix();

    this.renderer.render(this.scene, c);
  }
  
}

exports.Scene = Scene;
