
function computeEdgeLength (geometry) {

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
