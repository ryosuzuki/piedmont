# COMPILER = g++
# CFLAGS = -std=c++11 -Wno-c++11-extensions -w
# TARGET = convert
# SOURCES = convert.cpp
# INCLUDE = -I/usr/local/opt/eigen/include/eigen3/ \
# 	-I/Users/ryosuzuki/Documents/c++/libigl/include/

# compile:
# 	$(COMPILER) $(CFLAGS) -o $(TARGET) $(INCLUDE) $(SOURCES)

# all:
# 	compile

# clean:
# 	-rm -f $(TARGET)

compile:
	g++ -std=c++11 -I/usr/local/opt/eigen/include/eigen3/ -I/Users/ryosuzuki/Documents/c++/libigl/include convert.cpp -o hello