import THREE from 'three'
import _ from 'lodash'

import '../node_modules/three/examples/js/loaders/OBJLoader.js'
import '../node_modules/three/examples/js/loaders/STLLoader.js'
import '../node_modules/three/examples/js/loaders/BinaryLoader.js'

class Geometry extends THREE.Geometry {
  constructor () {
    super()
  }

  load (file) {
    this.file = file
    let objLoader = new THREE.OBJLoader()
    var req = new XMLHttpRequest();
    req.open('GET', this.file, false);
    req.send(null);
    let text = req.responseText
    let res = objLoader.parse(text)
    let object = res.children[0].geometry
    let positions = object.attributes.position.array
    this.convertPositionsToGeometry(positions)
    if (object.attributes.uv) {
      this.getInitialUv(object)
    }
  }

  getInitialUv (object) {
    var mappings = object.attributes.uv.array
    var n = mappings.length/2
    for (var i=0; i<this.faces.length; i++) {
      var face = this.faces[i]
      var a = face.a
      var b = face.b
      var c = face.c
      var uv_a = new THREE.Vector2(mappings[2*a], mappings[2*a+1])
      var uv_b = new THREE.Vector2(mappings[2*b], mappings[2*b+1])
      var uv_c = new THREE.Vector2(mappings[2*c], mappings[2*c+1])
      this.faceVertexUvs[0][i] = [uv_a, uv_b, uv_c]
    }
  }

  convertPositionsToGeometry (positions) {
    var n = positions.length/9
    for (var i=0; i<n; i++) {
      var v1 = new THREE.Vector3(
        positions[9*i],
        positions[9*i+1],
        positions[9*i+2]
      )
      var v2 = new THREE.Vector3(
        positions[9*i+3],
        positions[9*i+4],
        positions[9*i+5]
      )
      var v3 = new THREE.Vector3(
        positions[9*i+6],
        positions[9*i+7],
        positions[9*i+8]
      )
      var num = this.vertices.length
      this.vertices.push(v1)
      this.vertices.push(v2)
      this.vertices.push(v3)
      this.faces.push(new THREE.Face3(num, num+1, num+2))
    }
    this.computeFaceNormals()
  }

  computeVertexNormals () {
    for (let i=0; i<this.uniq.length; i++) {
      let v = this.uniq[i];
      let vertex_normal = new THREE.Vector3();
      let normals = [];
      for (let j=0; j<v.faces.length; j++) {
        let index = v.faces[j];
        let face = this.faces[index];
        let normal = face.normal;
        vertex_normal.add(normal);
        normals.push(normal);
      }
      vertex_normal.divideScalar(v.faces.length).normalize();
      this.uniq[i].vertex_normal = vertex_normal;
    }
  }

  computeUniq () {
    console.log('Start computeUniq')
    let vertices = this.vertices;
    let map = new Array(vertices.length);
    let uniq = [];
    let epsilon = Math.pow(10, -6);
    for (let i=0; i<vertices.length; i++) {
      let vertex = vertices[i];
      let bool = true;
      let index;
      for (let j=0; j<uniq.length; j++) {
        let e = uniq[j];
        if (
          Math.abs(vertex.x - e.vertex.x) < epsilon
          && Math.abs(vertex.y - e.vertex.y) < epsilon
          && Math.abs(vertex.z - e.vertex.z) < epsilon
          // vertex.equals(e.vertex)
        ) {
          bool = false;
          e.index.push(i);
          map[i] = j;
          break;
        }
      }
      if (bool) {
        uniq.push({ index: [i], vertex: vertex, id: uniq.length });
        map[i] = uniq.length-1;
      }
    }
    let faces = this.faces;
    let edges = new Array(uniq.length);
    let sides = new Array(uniq.length);
    for (let j=0; j<uniq.length; j++) {
      edges[j] = [];
      sides[j] = [];
    }
    for (let i=0; i<faces.length; i++) {
      let face = faces[i];
      let a = map[face.a];
      let b = map[face.b];
      let c = map[face.c];

      edges[a].push(a)
      edges[a].push(b)
      edges[a].push(c)
      edges[a] = _.uniq(edges[a])
      sides[a].push(i);
      uniq[a].edges = edges[a];

      edges[b].push(b)
      edges[b].push(a)
      edges[b].push(c)
      edges[b] = _.uniq(edges[b])
      uniq[b].edges = edges[b];

      edges[c].push(c)
      edges[c].push(a)
      edges[c].push(b)
      edges[c] = _.uniq(edges[c]);
      uniq[c].edges = edges[c];

      if (!uniq[a].faces) uniq[a].faces = [];
      if (!uniq[b].faces) uniq[b].faces = [];
      if (!uniq[c].faces) uniq[c].faces = [];
      uniq[a].faces.push(i);
      uniq[b].faces.push(i);
      uniq[c].faces.push(i);
      uniq[a].faces = _.uniq(uniq[a].faces);
      uniq[b].faces = _.uniq(uniq[b].faces);
      uniq[c].faces = _.uniq(uniq[c].faces);
    }
    this.uniq = uniq;
    this.map = map;
    this.edges = edges;

    window.uniq = uniq;
    window.map = map;
    window.edges = edges;
    window.faces = this.faces;

    console.log('Finish computeUniq')
  }

}

export default Geometry