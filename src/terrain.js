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

    total += 1;
  }

  setViewer(viewer) {
    this.viewer.copy(viewer);
  }

  updateDistance() {
    this.distance = this.viewer.distanceTo(this.position);
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

    this.subdiv = 8;

    this.children = [];
    
    this.is_subdivided = false;
    this.use_subdivided = false;

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
    this.mesh.visible = !status;

    if(status == false) {
      for(i=0; i<this.children.length; i++) {
        this.children[i].mesh.visible = false;
      }
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

    this.ready = true;

    var color = 0xff0000;
    
    if(this.level == 1)
      color = 0xffff00;
    else if(this.level == 1)
      color = 0x00ff00;
    else if(this.level == 2)
      color = 0x0000ff;
    else if(this.level == 4)
      color = 0x00ffff;
    else if(this.level == 5)
      color = 0xff00ff;
    else if(this.level == 6)
      color = 0xffffff;
    else if(this.level == 7)
      color = 0x444444;
    else if(this.level == 8)
      color = 0xff0088;
    else if(this.level == 9)
      color = 0x00ffaa;
    else if(this.level == 10)
      color = 0xaaffaa;
    else if(this.level == 11)
      color = 0x3388ff;
    else if(this.level == 12)
      color = 0x00aa00;
    else if(this.level == 13)
      color = 0x0000aa;
    else if(this.level == 14)
      color = 0x222222;
    
    this.material = new T.MeshPhongMaterial({
      /// shading: T.FlatShading,
      color: 0xdddddd
    });

    var extra = 0;

    var se = this.size / this.subdiv * 2;
    
    var geometry = new T.PlaneGeometry(this.size + se, this.size + se, this.subdiv + extra * 2, this.subdiv + extra * 2);
    
    // this.mesh = new T.Mesh(geometry, this.manager.material);
    this.mesh = new T.Mesh(geometry, this.material);

    this.mesh.position.x = this.position.x;
    this.mesh.position.y = this.position.y;

    var s = 0.001;

    var noise = this.manager.noise;

    function o(xy, f, a) {
      return noise.simplex2(xy[0] * f, xy[1] * f) * a;
    }

    function f(xy) {
      var v = 0;
      var f = 1 / 15000;
      var a = 1200;
      
      v += o(xy, f / 50, a * 20);
      v += o(xy, f / 10, a * 5);
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

    for(var i=0; i<geometry.vertices.length; i++) {
      v = geometry.vertices[i];
      geometry.vertices[i].z = f([v.x + this.mesh.position.x, v.y + this.mesh.position.y]);
    }

    geometry.computeFaceNormals();
    
    geometry.computeVertexNormals();
    
    var scene = this.manager.instance.scene.scene;

    scene.add(this.mesh);

  }

  setViewer(viewer) {
    super.setViewer(viewer);
    
    for(var i=0; i<this.children.length; i++) {
      this.children[i].setViewer(viewer);
    }

  }

  tick(elapsed) {
    if(!this.mesh) this.createMesh();

    if(this.level >= 18) return;
    
    this.updateDistance();

    var scene = this.manager.instance.scene;
    
    var spacing = ((Math.sin(util.radians(scene.activeCamera().fov)) / Math.max(1, this.distance - this.size * 0.7)) * scene.size[1]) * (this.size / this.subdiv);

    if(this.parent.use_subdivided && !this.use_subdivided) this.mesh.visible = true;

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

    this.material = new T.MeshBasicMaterial({
      color: 0xff00ff,
      wireframe: true
    });
    
    this.view_distance = 10000 * 1000;

    this.viewer = new T.Vector3();

    this.noise = new Noise(Math.random());

    this.tile = new TileGrid(this);

    this.tile.update();
  }

  setViewer(viewer) {
    var distance = this.viewer.distanceTo(viewer);
    
    if(distance < 100) return;

    this.viewer.copy(viewer);

    this.tile.setViewer(viewer);
  }

  tick(elapsed) {
    this.tile.tick();
  }
  
}

exports.Manager = Manager;
