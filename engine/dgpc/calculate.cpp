#include <iostream>

#include "Generator.h"
#include "Mesh.h"
#include <iostream>
#include <limits>

using namespace std;
using namespace Eigen;
using namespace rapidjson;

extern "C" {
  typedef struct {
    int n;
    int *id;
    double *r;
    double *theta;
  } Result_Mapping;

  int getMapping(char *json, Result_Mapping *res) {

    //Parse options
    if(argc < 3) usage_error(argv[0]);
    const char* filename = argv[1];
    const int source_idx = atoi(argv[2]);

    double stopdist = -1;
    if(argc > 3) {
      stopdist = atof(argv[3]);
    }
    double epsilon = -1;
    if(argc > 4) {
      epsilon = atof(argv[4]);
    }

    if(argc > 5) usage_error(argv[0]);

    //Declare point, mesh and generator
    typedef DGPC::Vector3<double> Point;
    typedef DGPC::MeshOM<Point> Mesh;
    typedef DGPC::Generator<Mesh> DGPCgenerator;

    //Read mesh from file
    Mesh my_mesh;
    my_mesh.openOBJ(filename);

    //Make a DGPC generator
    DGPCgenerator my_dgpc(my_mesh);

    //Set options
    if(stopdist > 0)
      my_dgpc.setStopDist(stopdist);

    if(epsilon > 0)
      my_dgpc.setEps(epsilon);

    //Set source node
    my_dgpc.setNodeSource(source_idx);

    //Optionally, the library also supports to set the source point:
    //Point p = Point(0,0,0);  //R3 coordinate of source
    //int face_idx = 0;                 //Face index of mesh where point lies
    //my_dgpc.setSource(point, face_idx);

    //Compute DGPC
    int last_node = my_dgpc.run();

    //Fetch and print result
    cout << "Computed distances until node " << last_node << endl;
    cout << endl;
    cout << "i      r      theta" << endl;
    cout << "-------------------" << endl;
    for(int i = 0; i < my_mesh.n_vertices(); i++) {
      const double r = my_dgpc.getDistance(i);
      if(r < numeric_limits<double>::max()) {
        const double theta = my_dgpc.
        getAngle(i);
        cout << i << "    " << r << "    "<< theta << endl;
      }
    }

  }
}

