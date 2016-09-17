import THREE from 'three'
import _ from 'lodash'

import OBJLoader from './three/obj-loader'
import FaceInfo from './face-info'

class Geometry extends THREE.Geometry {
  constructor () {
    super()
    this.file = null
    this.text = null
  }

  init () {
    this.get()
    this.load()
  }

  get () {
    var req = new XMLHttpRequest();
    req.open('GET', this.file, false);
    req.send(null);
    this.text = req.responseText
  }

  load () {
    let objLoader = new OBJLoader()
    let res = objLoader.parse(this.text)
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

  computeFaceInfo () {
    for (let i=0; i<this.faces.length; i++) {
      const faceIndex = i
      const face = this.faces[faceIndex]
      var va  = this.vertices[face.a]
      var vb  = this.vertices[face.b]
      var vc  = this.vertices[face.c]
      va = new THREE.Vector3(va.x, va.y, va.z)
      vb = new THREE.Vector3(vb.x, vb.y, vb.z)
      vc = new THREE.Vector3(vc.x, vc.y, vc.z)
      var normal = new THREE.Vector3(face.normal.x, face.normal.y, face.normal.z)
      var faces_a = this.uniq[this.map[face.a]].faces
      var faces_b = this.uniq[this.map[face.b]].faces
      var faces_c = this.uniq[this.map[face.c]].faces

      var faces_ab = _.intersection(faces_a, faces_b)
      var faces_bc = _.intersection(faces_b, faces_c)
      var faces_ca = _.intersection(faces_c, faces_a)

      var v = new THREE.Vector3()
      var n1 = this.faces[faces_ab[0]].normal
      var n2 = this.faces[faces_ab[1]].normal
      var normal_ab = v.clone().addVectors(n1, n2).normalize()

      var n1 = this.faces[faces_bc[0]].normal
      var n2 = this.faces[faces_bc[1]].normal
      var normal_bc = v.clone().addVectors(n1, n2).normalize()

      var n1 = this.faces[faces_ca[0]].normal
      var n2 = this.faces[faces_ca[1]].normal
      var normal_ca = v.clone().addVectors(n1, n2).normalize()

      var normal_a = this.uniq[this.map[face.a]].vertex_normal
      var normal_b = this.uniq[this.map[face.b]].vertex_normal
      var normal_c = this.uniq[this.map[face.c]].vertex_normal

      var hash = {
        faceIndex: faceIndex,
        va: va,
        vb: vb,
        vc: vc,
        normal: Geometry.roundVector3(normal),
        normal_a: Geometry.roundVector3(normal_a),
        normal_b: Geometry.roundVector3(normal_b),
        normal_c: Geometry.roundVector3(normal_c),
        normal_ab: Geometry.roundVector3(normal_ab),
        normal_bc: Geometry.roundVector3(normal_bc),
        normal_ca: Geometry.roundVector3(normal_ca),
      }
      hash = _.extend(hash, face)
      this.faces[faceIndex] = new FaceInfo(this, hash)
    }
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

    console.log('Finish computeUniq')
  }

  static roundVector3 (v) {
    if (!v) return new THREE.Vector3(0, 0, 0)
    var vec = [v.x, v.y, v.z]
    vec = vec.map( function (val) {
      return val // parseFloat(val.toFixed(5))
    })
    return new THREE.Vector3(vec[0], vec[1], vec[2])
  }

  static round (array) {
    return array.map( function (a) {
      return a.map( function (val) {
        return val // parseFloat(val.toFixed(5))
      })
    })
  }

  static getIndex (positions, uv) {
    var epsilon = Math.pow(10, -2)
    var ui = _.map(positions, 0).indexOf(uv[0])
    var vi = _.map(positions, 1).indexOf(uv[1])
    if (ui == -1 || vi == -1) {
      var diff = positions.map( function (pos) {
        return Math.abs(pos[0] - uv[0]) + Math.abs(pos[1] - uv[1])
      })
      var min = _.min(diff)
      var index = diff.indexOf(min)
      return { index: index, equal: false }
      /*
      if (min < epsilon) {
        return { index: index, equal: false }
      } else {
        return false
      }
      */
    }
    if (ui == vi) {
      return { index: ui, equal: true }
    } else {
      if (positions[ui][0] == uv[0] && positions[ui][1] == uv[1]) {
        return { index: ui, equal: true }
      }
      if (positions[vi][0] == uv[0] && positions[vi][1] == uv[1]) {
        return { index: vi, equal: true }
      }
      // debugger
      return false
    }
  }

  static drawSVG (points) {
    var path = '';
    for (var i=0; i<points.length; i++){
      path += (i && 'L' || 'M') + points[i]
    }
    var d = path
    return d;
  }

}

export default Geometry