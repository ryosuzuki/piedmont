

function getBoundary () {
  console.log('Start getMapping')
  var json = {
    uniq: geometry.uniq,
    faces: geometry.faces,
    map: geometry.map,
    edge_map: geometry.edge_map,
    boundary: geometry.boundary
  };
  $.ajax({
    url: '/get-mapping',
    type: 'POST',
    datatype: 'JSON',
    data: {
      json: JSON.stringify(json)
    },
    success: function (data) {
      console.log('Get result');
      console.log(data);

      window.cuts = data.cuts;

      var paths = [];
      for (var fid in cuts) {
        var face = geometry.faces[fid];
        if (cuts[fid].includes(0)) {
          paths.push({ start: map[face.a], end: map[face.b] });
        }
        if (cuts[fid].includes(1)) {
          paths.push({ start: map[face.b], end: map[face.c] });
        }
        if (cuts[fid].includes(2)) {
          paths.push({ start: map[face.c], end: map[face.a] });
        }
      }

      var m = new THREE.LineBasicMaterial({
        color: 0xff0000,
        linewidth: 10
      });
      var g = new THREE.Geometry();
      for (var i=0; i<paths.length-1; i++) {
        var s = geometry.uniq[paths[i].start].vertex;
        var e = geometry.uniq[paths[i].end].vertex;
        g.vertices.push(new THREE.Vector3(s.x, s.y, s.z));
        g.vertices.push(new THREE.Vector3(e.x, e.y, e.z));
      }
      var line = new THREE.Line(g, m);
      scene.add(line);
    }
  });

}

function computeGraph () {

  var dijkstra = new Dijkstra(geometry.edge_map);
  var nodes = geometry.boundary;
  var edges = []
  var m = new THREE.LineBasicMaterial({color: 0xff0000, linewidth: 10});
  var g = new THREE.Geometry();
  for (var i=0; i<geometry.boundary.length-1; i++) {
    var id_i = geometry.boundary[i];
    var id_j = geometry.boundary[i+1];
    var result = dijkstra.path(id_i.toString(), id_j.toString(), { cost: true });
    var path = result.path;
    var cost = result.cost;
    var edge = [id_i, id_j, cost];
    edges.push(edge);
  }
  var k = new kruskal( { nodes : nodes, edges : edges }, function (edgelist){
    console.log(edgelist);
    window.edgelist = edgelist;
    for (var i=0; i<edgelist.length; i++) {
      var s = geometry.uniq[edgelist[i][0]].vertex;
      var e = geometry.uniq[edgelist[i][1]].vertex;
      g.vertices.push(new THREE.Vector3(s.x, s.y, s.z));
      g.vertices.push(new THREE.Vector3(e.x, e.y, e.z));
    }
  });



  var line = new THREE.Line(g, m);
  scene.add(line);
}

function computeGraph2 (geometry) {
  var graph = new Graph(geometry.edge_map);
  var V = geometry.boundary;
  var E = {};
  for (var i=0; i<geometry.boundary.length; i++) {
    var id_i = geometry.boundary[i];
    E[id_i] = {}
    for (var j=i+1; j<geometry.boundary.length; j++) {
      var id_j = geometry.boundary[j];
      var result = graph.path(id_i.toString(), id_j.toString(), { cost: true });
      var path = result.path;
      var length = result.cost;
      E[id_i][id_j] = length;
    }
  }
  console.log(E);
  window.E = E;
  return geometry;
}


function computeEdgeLength (geometry) {
  console.log('Start computeEdgeLength');
  geometry.edge_map = {};
  geometry.uniq = geometry.uniq.map( function (v) {
    edge_length = {}
    v.edges.map( function (id) {
      var e = geometry.uniq[id];
      var d = v.vertex.distanceTo(e.vertex);
      if (d > 0) edge_length[id] = d;
    })
    v.edge_length = edge_length;
    geometry.edge_map[v.id] = edge_length;
    return v;
  })
  console.log('Finish computeEdgeLength');
  return geometry;
}


function computeEdges (geometry) {
  console.log('Start computeEdges')

  var edges = new Array(geometry.uniq.length);
  for (var i=0; i<geometry.faces.length; i++) {
    var face = geometry.faces[i];
    var a = geometry.map[face.a];
    var b = geometry.map[face.b];
    var c = geometry.map[face.c];

    if (!edges[a]) edges[a] = [];
    edges[a].push(a)
    edges[a].push(b)
    edges[a].push(c)
    edges[a] = _.uniq(edges[a])
    geometry.uniq[a].edges = edges[a];

    if (!edges[b]) edges[b] = [];
    edges[b].push(b)
    edges[b].push(a)
    edges[b].push(c)
    edges[b] = _.uniq(edges[b])
    geometry.uniq[b].edges = edges[b];

    if (!edges[c]) edges[c] = [];
    edges[c].push(c)
    edges[c].push(a)
    edges[c].push(b)
    edges[c] = _.uniq(edges[c]);
    geometry.uniq[c].edges = edges[c];

    if (!geometry.uniq[a].faces) geometry.uniq[a].faces = [];
    if (!geometry.uniq[b].faces) geometry.uniq[b].faces = [];
    if (!geometry.uniq[c].faces) geometry.uniq[c].faces = [];
    geometry.uniq[a].faces.push(i);
    geometry.uniq[b].faces.push(i);
    geometry.uniq[c].faces.push(i);
    geometry.uniq[a].faces = _.uniq(geometry.uniq[a].faces);
    geometry.uniq[b].faces = _.uniq(geometry.uniq[b].faces);
    geometry.uniq[c].faces = _.uniq(geometry.uniq[c].faces);
  }
  geometry.edges = edges;
  console.log('Finish computeEdges')
  return geometry;
}
