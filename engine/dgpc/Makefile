COMPILER = g++
CFLAGS = -dynamiclib -std=c++11 -Wno-c++11-extensions -w
TARGET = dgpc.dylib
SOURCES = calculate.cpp
INCLUDE = -I./src/
LIBS = -L./lib/ \
	./lib/libOpenMeshCore.a \
	./lib/libOpenMeshTools.a

compile:
	$(COMPILER) $(CFLAGS) -o $(TARGET) $(INCLUDE) $(LIBS) $(SOURCES)

all:
	compile
