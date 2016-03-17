
// paper.install(window);

var start;
var end;
var lines = [];
var points = [];
var paths = [];
var draft;
var pathStyle = {
  strokeColor: 'black',
  strokeWidth: 5,
  fullySelected: true
}


var lines = [];
var arcs = [];
var circles = [];

window.onload = function () {
  paper.setup('canvas');

  var tool = new paper.Tool();
  tool.onMouseDown = function (event) {
    if (draft) {
      draft.selected = false;
    }
    draft = new paper.Path(pathStyle);
    draft.segments = [event.point];
    start = event.point;
  }

  tool.onMouseDrag = function (event) {
    draft.add(event.point);
  }

  tool.onMouseUp = function(event) {
    var segmentCount = draft.segments.length;
    draft.simplify(10);
    var newSegmentCount = draft.segments.length;
    var difference = segmentCount - newSegmentCount;
    var percentage = 100 - Math.round(newSegmentCount / segmentCount * 100);
    end = event.point;


    console.log('Start exportSVG')
    var path = beautify(draft);
    if (texture) texture.material.map.needsUpdate = true;
    var svg = path.exportSVG();
    d = $(svg).attr('d');
    console.log('Start svgMesh3d')
    svgMesh = svgMesh3d(d, {
      scale: 10,
      simplify: 0.1,
      // randomization: 1000,
    });
    complex = reindex(unindex(svgMesh.positions, svgMesh.cells));
    // drawSVG(complex)

    uvMap = {}
    uvMap.cells = svgMesh.cells;
    uvMap.positions = svgMesh.positions.map( function (pos) {
      var u = pos[0]/3 + 0.5;
      var v = pos[1]/3 + 0.5;
      return { u: u, v: v }
    })

  }


  paper.view.onFrame = function (event) {
  }
  paper.view.draw();

}


function beautify (draft) {
  draft.remove();
  var num = draft.segments.length;
  var total = 0;
  var x = draft.segments.map(function(seg) { return seg.point.x; });
  var y = draft.segments.map(function(seg) { return seg.point.y; });
  var points = draft.segments.map(function(seg) { return seg.point; });
  for (var i=0; i<num-2; i++) {
    var a = draft.segments[i];
    var b = draft.segments[(i+1)%num];
    var c = draft.segments[(i+2)%num];
    pv = a.point.subtract(b.point);
    nv = b.point.subtract(c.point);
    var angle = pv.getAngleInRadians(nv);
    total += angle;
  }

  var rectangle = new paper.Rectangle(
    new paper.Point(_.min(x), _.min(y)),
    new paper.Point(_.max(x), _.max(y))
  );
  var path = new paper.Path.Ellipse(rectangle);
  path.style = pathStyle;
  path.style.fillColor = 'red';
  circles.push(path);
  console.log('circle');
  return path;

  /*
  if (total < 1) {
    var from = new Point(draft.segments[0].point);
    var to = new Point(draft.segments[num-1].point);
    var path = new Path.Line(from, to);
    path.style = pathStyle;
    lines.push(path);
    console.log('line');
  } else if (total < 5) {
    var from = new Point(draft.segments[0].point);
    var to = new Point(draft.segments[num-1].point);
    var through = new Point(draft.segments[Math.floor(num/2)].point);
    var path = new Path.Arc(from, through, to);
    path.style = pathStyle;
    arcs.push(path);
    console.log('arc');
  } else {
    var rectangle = new Rectangle(
      new Point(_.min(x), _.min(y)),
      new Point(_.max(x), _.max(y))
    );
    var path = new Path.Ellipse(rectangle);
    path.style = pathStyle;
    path.style.fillColor = 'red';
    circles.push(path);
    console.log('circle');
  }
  */
}

