
#include <igl/readOBJ.h>
#include <igl/writeOFF.h>
#include <igl/cotmatrix.h>
#include <Eigen/Dense>
#include <iostream>

int main() {

  Eigen::MatrixXd V;
  Eigen::MatrixXi F;
  igl::readOBJ("./temp.obj", V, F);
  igl::writeOFF("./temp.off",V, F);
  std::cout << "convert done" << std::endl;

  return 0;
}
