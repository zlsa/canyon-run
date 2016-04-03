'use strict';

var util = require('./util');

var $ = require('jquery');

var C = require('cannon');
var T = require('three');
var events = require('./events');

var Noise = require('noisejs').Noise;

function distance_2d(a, b) {
  var xy = a;

  if(b) {
    xy[0] = Math.abs(a[0] - b[0]);
    xy[1] = Math.abs(a[1] - b[1]);
  }
  
  return Math.sqrt(Math.pow(Math.abs(xy[0]), 2) + Math.pow(Math.abs(xy[1]), 2));
}

class Tile extends events.Events {

  constructor(manager, position) {
    super();

    this.manager = manager;

    this.position = position;

    this.mesh = null;
    this.body = null;

    this.lods = {};

    this.current_lod = 0;
  }

  isCreated() {
    return this.created;
  }

  isUpToDate() {
    if(!(this.requestedLOD() in this.lods)) return false;
    return true;
  }

  requestedLOD() {
    var distance = this.position.distanceTo(this.manager.getViewerTileVec3());
    
    var base = util.clerp(4, distance, 50, 3, 2);
    base += util.clerp(1.5, distance, 4, 3, 0);
    
    return Math.floor(base);
  }

  create() {
    var rl = this.requestedLOD();
    for(var i in this.lods) {
      this.lods[i].visible = false;
    }

    if(!(rl in this.lods)) {
      this.createLOD(this.requestedLOD());
    }

    this.lods[rl].visible = true;
    
    return rl;
  }

  createLOD(lod) {
    var extra = 2;
    
    var divisions = 1;

    for(var i=0; i<lod; i++)
      divisions *= 2;

    var size_per_division = this.manager.tile_size / divisions;
    
    divisions += extra * 2;

    var size = this.manager.tile_size + (size_per_division * extra * 2);

    var geometry = new T.PlaneGeometry(size, size, divisions, divisions);
    
    var mesh = new T.Mesh(geometry, this.manager.materials[lod]);
    
    mesh.position.x = this.position.x * this.manager.tile_size;
    mesh.position.y = this.position.y * this.manager.tile_size;

    var s = 0.001;

    var noise = this.manager.noise;

    function o(xy, f, a) {
      return noise.simplex2(xy[0] * f, xy[1] * f) * a;
    }

    function f(xy) {
      var v = 0;
      var f = 1 / 15000;
      var a = 1200;
      
      v += o(xy, f, a);
      v += o(xy, f * 3, a * 0.4);
      v += o(xy, f * 5, a * 0.2);

      v += o(xy, f * 15, a * 0.04);

      v += o(xy, f * 50, a * 0.02);
      
      v += o(xy, f * 150, a * 0.007);
      v += o(xy, f * 250, a * 0.003);
      
      v += o(xy, f * 500, a * 0.002);
      v += o(xy, f * 800, a * 0.002);
      
      return v;
    }
    
    var v;

    for(i=0; i<geometry.vertices.length; i++) {
      v = geometry.vertices[i];
      geometry.vertices[i].z = f([v.x + mesh.position.x, v.y + mesh.position.y]);
    }

    geometry.computeFaceNormals();
    geometry.computeVertexNormals();

    geometry.faceVertexUvs[0] = [];
    
    var faces = geometry.faces;
    
    s = 1 / 3000;

    for(i=0; i<faces.length; i++) {

      var v1 = geometry.vertices[faces[i].a];
      var v2 = geometry.vertices[faces[i].b];
      var v3 = geometry.vertices[faces[i].c];

      geometry.faceVertexUvs[0].push([
        new T.Vector2(s * (v1.x + mesh.position.x), s * (v1.y + mesh.position.y)),
        new T.Vector2(s * (v2.x + mesh.position.x), s * (v2.y + mesh.position.y)),
        new T.Vector2(s * (v3.x + mesh.position.x), s * (v3.y + mesh.position.y))
      ]);

    }

    geometry.uvsNeedUpdate = true;

    mesh.visible = true;

    this.manager.instance.scene.scene.add(mesh);

    this.lods[lod] = mesh;

    /// var wire = new T.WireframeHelper(this.mesh, 0x000000);
    /// wire.material.linewidth = 1;
    /// this.manager.instance.scene.scene.add(wire);
  }

}

class Manager extends events.Events {

  constructor(instance) {
    super();

    this.materials = {};

    this.ready = false;

    this.instance = instance;

    this.viewer = new T.Vector3();

    this.tile_size = 5000;
    this.visibility_range = 100000;

    this.fuzz = 100;
    
    this.tile_ids = {};

    this.tiles = [];

    this.noise = new Noise(Math.random());

    this.temp = {
      v3a: new T.Vector3()
    };

    this.createMaterials();
  }

  createMaterials() {
    var tex = new T.Texture(window.img);
    tex.wrapS = tex.wrapT = T.RepeatWrapping;
    
    tex.anisotropy = 8;
    
    tex.needsUpdate = true;

    var s = 0.05;
    
    for(var i=0; i<10; i++) {
      this.materials[i] = new T.MeshPhongMaterial({
        color: 0xcc9988,
        shininess: 0.2,
        // wireframe: true,
        normalMap: tex,
        normalScale: new T.Vector2(s, s)
      });
    }

    this.ready = true;
    this.updateVisibility();
  }

  setViewer(viewer) {
    if(!this.ready) return;
    var distance = this.viewer.distanceTo(viewer);
    if(distance < this.fuzz) return;

    this.viewer.copy(viewer);

    this.updateVisibility();
  }

  getViewerTile() {
    return this.worldToTile([this.viewer.x, this.viewer.y]);
  }
  
  getViewerTileVec3() {
    this.temp.v3a.x = this.viewer.x / this.tile_size;
    this.temp.v3a.y = this.viewer.y / this.tile_size;
    this.temp.v3a.z = this.viewer.z / this.tile_size;
    return this.temp.v3a;
  }

  worldToTile(xy) {
    var x = Math.round(xy[0] / this.tile_size);
    var y = Math.round(xy[1] / this.tile_size);
    
    return [x, y];
  }

  tileToKey(xy) {
    return xy[0] + ':' + xy[1];
  }
  
  updateVisibility() {
    var required = [];
    var coord = this.getViewerTile();

    var radius = Math.ceil(((this.visibility_range + this.fuzz) / this.tile_size) + 2);

    var c;

    for(var x=-radius; x<radius; x++) {
      for(var y=-radius; y<radius; y++) {

        c = [x + coord[0], y + coord[1]];
        
        if(distance_2d([Math.abs(x - coord[0]), Math.abs(y - coord[1])]) > radius) continue;

        required.push(c);
      }
    }

    function f(x) {
      return distance_2d(x);
    }

    required.sort(function(a, b) {
      if(f(a) > f(b)) return 1;
      else if(f(a) < f(b)) return -1;
      return 0;
    });

    for(var i=0; i<required.length; i++) {
      if(!this.hasTile(required[i]))
        this.createTile(required[i]);
    }
    
  }

  hasTile(xy) {
    if(this.tileToKey(xy) in this.tile_ids) return true;
    return false;
  }

  createTile(xy) {
    this.tile_ids[this.tileToKey(xy)] = true;
    this.tiles.push(new Tile(this, new T.Vector3(xy[0], xy[1], 0)));
  }

  tick(elapsed) {
    var max = 1;
    var done = 0;
    
    for(var i=0; i<this.tiles.length; i++) {
      
      if(!this.tiles[i].isUpToDate()) {
        var lod = this.tiles[i].create();
        done += Math.pow(lod, 2) + 1;
        
        if(done >= max) break;
      }
      
    }
    
  }
  
}

exports.Manager = Manager;
