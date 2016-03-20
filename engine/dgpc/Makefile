COMPILER = g++
CFLAGS = -dynamiclib -std=c++11 -Wno-c++11-extensions -w
TARGET = dgpc.dylib
# SOURCES = main.cpp
SOURCES = calculate.cpp
# TARGET = hoge
INCLUDE = -I./src/ \
	-I/usr/local/opt/rapidjson/include/
LIBS = -L/usr/local/opt/open-mesh/lib/ \
	/usr/local/opt/open-mesh/lib/libOpenMeshCore.a

compile:
	$(COMPILER) $(CFLAGS) -o $(TARGET) $(INCLUDE) $(LIBS) $(SOURCES)

all:
	compile
