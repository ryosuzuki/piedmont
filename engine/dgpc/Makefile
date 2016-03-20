COMPILER = g++
# CFLAGS = -dynamiclib -std=c++11 -Wno-c++11-extensions -w
# TARGET = mylib.dylib
SOURCES = main.cpp
TARGET = hoge
INCLUDE = -I./src/
LIBS = -L/usr/local/opt/open-mesh/lib/ \
	/usr/local/opt/open-mesh/lib/libOpenMeshCore.a

compile:
	$(COMPILER) $(CFLAGS) -o $(TARGET) $(INCLUDE) $(LIBS) $(SOURCES)

all:
	compile
