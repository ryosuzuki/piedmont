
#include <igl/readOBJ.h>
#include <igl/readSTL.h>
#include <igl/writeOFF.h>
#include <igl/cotmatrix.h>
#include <Eigen/Dense>
#include <iostream>

int main(int argc, char *argv[]) {

  Eigen::MatrixXd V;
  Eigen::MatrixXi F;
  Eigen::MatrixXd N;
  std::string type = argv[1];

  if (type == "stl") {
    igl::readSTL("./temp.stl", V, F, N);
  } else {
    igl::readOBJ("./temp.obj", V, F);
  }
  igl::writeOFF("./temp.off",V, F);
  std::cout << "convert done" << std::endl;

  return 0;
}
