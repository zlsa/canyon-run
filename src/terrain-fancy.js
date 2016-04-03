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

    this.updateDistance();

    this.update();
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

    this.subdiv = 6;

    this.parent = parent;

    this.size = parent.size * 0.5;

    this.level = parent.level + 1;

    this.children = [];
    
    this.is_subdivided = false;
    this.use_subdivided = false;

    this.ready = false;
  }

  useSubdivide(status) {
    if(this.use_subdivided === status) return;
    
    this.use_subdivided = status;
    this.mesh.visible = !status;

    if(status == false) {
      for(var i=0; i<this.children.length; i++) {
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
    
    this.material = new T.MeshBasicMaterial({
      color: color,
      wireframe: true
    });
    
    var geometry = new T.PlaneGeometry(this.size, this.size, this.subdiv, this.subdiv);
    
    // this.mesh = new T.Mesh(geometry, this.manager.material);
    this.mesh = new T.Mesh(geometry, this.material);

    this.mesh.position.x = this.position.x;
    this.mesh.position.y = this.position.y;

    var scene = this.manager.instance.scene.scene;

    scene.add(this.mesh);
  }

  tick(elapsed) {
    if(!this.mesh) this.createMesh();

    if(this.level >= 9) return;
    
    this.updateDistance();

    var scene = this.manager.instance.scene;
    
    var width = scene.size[0];

    var spacing = ((Math.sin(util.radians(65)) / Math.max(1, this.distance - this.size * 0.5)) * width) * (this.size / this.subdiv);

    if(spacing > 100) {
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

    this.size = 100 * 1000;

    this.tile_ids = {};
    this.tiles = [];
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
    console.log(xy);
    var tile = new NestTile(this.manager, this, new T.Vector3(xy[0] * this.size, xy[1] * this.size, 0));
    tile.size = this.size;
    this.tile_ids[this.getTileID(xy)] = this.tiles.length;
    this.tiles.push(tile);
  }

  update() {
    if(this.tiles.length == 0) {
      this.createTile([0, 0]);
      return;
    }
    var required = [];

    var s = this.size;
    var radius = Math.ceil(this.manager.view_distance / s);

    for(var x=-radius; x<radius; x++) {
      for(var y=-radius; y<radius; y++) {
        required.push([Math.round(x + this.viewer.x / s), Math.floor(y + this.viewer.y / s)]);
      }
    }

    function f(x) {
      return util.distance_2d(x);
    }

    required.sort(function(a, b) {
      if(f(a) > f(b)) return 1;
      else if(f(a) < f(b)) return -1;
      return 0;
    });

    for(var i=0; i<required.length; i++) {
      if(!this.getTile(required[i]))
        this.createTile(required[i]);
    }

  }
  
  tick(elapsed) {
    var budget = 20; // ms
    var start = Date.now();
    
    var tile;
    
    for(var i=0; i<this.tiles.length; i++) {
      tile = this.tiles[i];

      tile.tick(elapsed);

      if(Date.now() - start > budget) {
        console.log('broke the budget');
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
    
    this.view_distance = 10 * 1000;

    this.viewer = new T.Vector3();

    this.noise = new Noise(Math.random());

    this.tile = new TileGrid(this);

    this.tile.update();
  }

  setViewer(viewer) {
    var distance = this.viewer.distanceTo(viewer);
    
    if(distance < 100) return;

    this.viewer.copy(viewer);

    this.tile.update();
  }

  tick(elapsed) {
    this.tile.tick();
  }
  
}

exports.Manager = Manager;
