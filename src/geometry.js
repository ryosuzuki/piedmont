import THREE from 'three'
import _ from 'lodash'


class Geometry extends THREE.Geometry {
  constructor () {
    super()
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