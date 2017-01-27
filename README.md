# Tabby
Interactive 3D modeling tools for adding geometric texture.

# Installation
## Install dependencies
```
git clone git@github.com:ryosuzuki/tabby.git
cd tabby
npm install
bower install
webpack
```

## Install CGAL
```
cd ~/Documents/c++
git clone git@github.com:CGAL/cgal.git

mkdir build
cd build
cmake -DCMAKE_BUILD_TYPE=Release ..
make
```

## Compile sufrace mesh parameterization
```
cd ~/Documents/c++/cgal
cd Surface_mesh_parameterization/examples/Surface_mesh_parameterization/
mkdir build
cmake -DCGAL_DIR:PATH=~/Documents/c++/cgal/build ..
make
```

## Instsall libigl
```
cd ~/Documents/c++
git clone git@github.com:libigl/libigl.git
```

## Install Eigen
```
brew install eigen
```

## Compile convert file
```
cd engine
make
```


## Run
```
npm start
```

