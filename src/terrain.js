'use strict';

var util = require('./util');

var $ = require('jquery');

var C = require('cannon');
var T = require('three');
var events = require('./events');

var Noise = require('noisejs').Noise;

var total = 0;

class Tile extends events.Events {

  constructor(manager, position) {
    super();

    this.manager = manager;

    this.size = 0;
    this.position = position;

    this.level = 0;

    this.viewer = new T.Vector3();
    
    this.distance = 0;

    this.temp = {
      v3a: new T.Vector3(),
      v3b: new T.Vector3()
    };

    total += 1;
  }

  setViewer(viewer) {
    this.viewer.copy(viewer);
  }

  updateDistance() {
    this.temp.v3a.copy(this.viewer);
    this.temp.v3b.copy(this.position);
    
    this.distance = this.temp.v3a.distanceTo(this.temp.v3b);
  }

  update() {

  }

}

class NestTile extends Tile {

  constructor(manager, parent, position) {
    super(manager, position);

    this.parent = parent;

    this.size = parent.size * 0.5;

    this.level = parent.level + 1;

    this.subdiv = 14;

    this.children = [];
    
    this.is_subdivided = false;
    this.use_subdivided = false;

    this.subdivide_fade = 0;

    this.ready = false;
  }

  useSubdivide(status) {
    if(this.use_subdivided === status) return;

    if(status === true) {
      for(var i=0; i<this.children.length; i++) {
        if(!this.children[i].ready) return;
      }
    }
    
    this.use_subdivided = status;

    if(status == false) {
      this.setVisible(false);
    }
    
    this.mesh.visible = !status;
    
  }

  setVisible(visible) {
    this.mesh.visible = visible;
    for(var i=0; i<this.children.length; i++) {
      this.children[i].setVisible(visible);
    }
  }
  
  subdivide() {
    if(this.is_subdivided) {
      return;
    }
    
    var offset = this.size * 0.25;
    var x, y, tile;
    for(var i=0; i<4; i++) {
      
      if(i == 0) {
        x = -1;
        y = -1;
      } else if(i == 1) {
        x = 1;
        y = -1;
      } else if(i == 2) {
        x = 1;
        y = 1;
      } else if(i == 3) {
        x = -1;
        y = 1;
      }
      
      tile = new NestTile(this.manager, this, new T.Vector3(this.position.x + x * offset, this.position.y + y * offset, 0));
      this.children.push(tile);
    }
    
    this.is_subdivided = true;
  }

  createMesh() {

    var extra = 2;

    var division_size = (this.size / this.subdiv);
    
    var geometry = new T.PlaneGeometry(this.size + division_size * extra, this.size + division_size * extra, this.subdiv + extra, this.subdiv + extra);
    
    this.mesh = new T.Mesh(geometry, this.manager.material);

    this.mesh.position.x = this.position.x;
    this.mesh.position.y = this.position.y;

    this.regenerateHeight();

    geometry.computeFaceNormals();
    
    var faces = geometry.faces;
    
    var s = 1 / 3000;

    var x = this.mesh.position.x;
    var y = this.mesh.position.y;
    
    var face;
    
    for(var i=0; i<faces.length; i++) {

      face = faces[i];

      var v1 = geometry.vertices[face.a];
      var v2 = geometry.vertices[face.b];
      var v3 = geometry.vertices[face.c];

      geometry.faceVertexUvs[0].push([
        new T.Vector2(s * (v1.x + x), s * (v1.y + y)),
        new T.Vector2(s * (v2.x + x), s * (v2.y + y)),
        new T.Vector2(s * (v3.x + x), s * (v3.y + y))
      ]);

      // face.vertexNormals = [
      // face.normal,
      // face.normal,
      // face.normal
      // ];

    }

    geometry.computeVertexNormals();
    
    geometry.uvsNeedUpdate = true;

    this.mesh.visible = !this.parent.use_subdivided;
    
    var scene = this.manager.getScene(this.level);

    this.position.z = this.getAltitude([this.mesh.position.x, this.mesh.position.y]);
    
    scene.add(this.mesh);

    this.ready = true;
  }

  getAltitude(xy) {

    var _this = this;
    
    function o(offset, xy, f, a) {
      return _this.manager.noise.simplex2(offset[0] + xy[0] * f, offset[1] + xy[1] * f) * a;
    }

    var v = 0;
    var f = 1 / 15000;
    var a = 1200;
    
    v += o([100, 50], xy, f / 50, a * 100);
    v += o([300, 200], xy, f / 10, a * 20);
    v += o([110, 500], xy, f / 5, a * 3);
    v += o([500, 200], xy, f * 1, a * 1.2);
    v += o([300, 400], xy, f * 3, a * 0.5);
    v += o([900, 800], xy, f * 5, a * 0.3);

    v += o([250, 800], xy, f * 15, a * 0.2);

    v += o([200, 590], xy, f * 50, a * 0.05);
    
    v += o([120, 380], xy, f * 150, a * 0.007);
    v += o([300, 100], xy, f * 250, a * 0.003);
    
    return v;
    
    v += o([150, 900], xy, f * 500, a * 0.002);
    v += o([100, 200], xy, f * 800, a * 0.002);
    v += o([200, 300], xy, f * 1600, a * 0.001);
      
    return v;
    
  }

  regenerateHeight() {

    var s = 0.001;

    var vxy, vsxy, z, v;

    var _this = this;

    for(var i=0; i<this.mesh.geometry.vertices.length; i++) {
      v = this.mesh.geometry.vertices[i];

      vxy = [v.x, v.y];

      v.z = this.getAltitude([vxy[0] + this.mesh.position.x, vxy[1] + this.mesh.position.y]);
    }

  }

  setViewer(viewer) {
    super.setViewer(viewer);
    
    for(var i=0; i<this.children.length; i++) {
      this.children[i].setViewer(viewer);
    }

  }

  tick(elapsed) {
    if(!this.mesh) this.createMesh();

    if(this.level >= 17) return;
    
    this.updateDistance();

    var scene = this.manager.instance.scene;
    
    var spacing = ((Math.sin(util.radians(scene.activeCamera().fov)) / Math.max(1, this.distance - this.size * 0.7)) * scene.size[1]) * (this.size / this.subdiv);

    if(this.parent.use_subdivided && !this.use_subdivided) {
      var ready = true;
      for(var i=0; i<this.children.length; i++) {
        if(!this.children[i].mesh) ready = false;
      }

      if(ready)
        this.mesh.visible = true;
    }

    if(spacing > 30) {

      this.subdivide();

      for(var i=0; i<this.children.length; i++) {
        this.children[i].tick(elapsed);
      }

      this.useSubdivide(true);
      
    } else {

      this.useSubdivide(false);
      
    }

  }

}

class TileGrid extends Tile {

  constructor(manager) {
    super(manager);

    this.size = 2000 * 1000;

    this.tile_ids = {};
    this.tiles = [];

    this.use_subdivided = true;
  }

  setViewer(viewer) {
    super.setViewer(viewer);
    
    for(var i=0; i<this.tiles.length; i++) {
      this.tiles[i].setViewer(viewer);
    }

    this.update();
  }

  getTileID(xy) {
    return xy[0] + ':' + xy[1];
  }

  getTile(xy) {
    var id = this.getTileID(xy);

    if(!id in this.tile_ids) return null;
    
    return this.tiles[this.tile_ids[id]];
  }

  getAltitude(position) {
    var s = this.size;
    var tile = this.getTile([Math.round(position[0] / s), Math.round(position[1] / s)]);
    if(tile) return tile.getAltitude(position);
  }

  createTile(xy) {
    console.log('new tile');
    var tile = new NestTile(this.manager, this, new T.Vector3(xy[0] * this.size, xy[1] * this.size, 0));
    tile.size = this.size;
    this.tile_ids[this.getTileID(xy)] = this.tiles.length;
    this.tiles.push(tile);
  }

  update() {
    var required = [];

    var s = this.size;
    var radius = Math.ceil(this.manager.view_distance / s) + 2;

    var viewer = this.viewer;

    for(var x=-radius; x<radius; x++) {
      for(var y=-radius; y<radius; y++) {
        required.push([x, y]);
      }
    }

    function f(xy) {
      return util.distance_2d([Math.abs(xy[0] - viewer.x / s), Math.abs(xy[1] - viewer.y / s)]);
    }

    required.sort(function(a, b) {
      if(f(a) > f(b)) return 1;
      else if(f(a) < f(b)) return -1;
      return 0;
    });

    var xy;

    for(var i=0; i<required.length; i++) {
      xy = [Math.round(required[i][0] + this.viewer.x / s), Math.round(required[i][1] + this.viewer.y / s)];
      if(!this.getTile(xy))
        this.createTile(xy);
    }

  }
  
  tick(elapsed) {
    var budget = 20; // ms
    var start = Date.now();
    
    var tile;

    this.start_id = 0;

    var id;
    
    for(var i=this.start_id; i<(this.start_id + this.tiles.length); i++) {
      id = i % this.tiles.length;
      tile = this.tiles[id];

      tile.tick(elapsed);

      if(Date.now() - start > budget) {
        this.start_id = id;
        break;
      }
      
    }
    
  }
  
}

class Manager extends events.Events {

  constructor(instance) {
    super();

    this.instance = instance;

    this.material = new T.MeshPhongMaterial({
      shading: T.FlatShading,
      color: 0xffccbb
    });
    
    this.view_distance = 10000 * 1000;

    this.viewer = new T.Vector3();

    this.noise = new Noise(0);

    this.tile = new TileGrid(this);

    this.tile.update();
  }

  getScene(level) {
    return this.instance.scene.scene;
  }

  setViewer(viewer) {
    var distance = this.viewer.distanceTo(viewer);
    
    if(distance < 500) return;

    this.viewer.copy(viewer);

    this.tile.setViewer(viewer);
  }

  tick(elapsed) {
    this.tile.tick();
  }

  getAltitude(position) {
    return this.tile.getAltitude(position);
  }

  render(elapsed) {

  }
  
}

exports.Manager = Manager;
