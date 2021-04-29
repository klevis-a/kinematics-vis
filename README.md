This JavaScript application enables biomechanics researchers to visualize and analyze shoulder joint kinematics. It is built on top of [three.js](https://threejs.org/), a Javascript 3D library. Although presently this application is specialized for analyzing and visualizing the shoulder joint, it should be easy to extend its functionality to other joints.

Checkout the [live code demo](https://shouldervis.chpc.utah.edu/kinevis/main.html) currently hosted at the [University of Utah Center for High Performance Computing](https://www.chpc.utah.edu/).

### Installation

##### Clone repository
```
git clone https://github.com/klevis-a/kinematics-vis.git
cd kinematics-vis
```

##### Download code dependencies and data repository

###### Windows
```
downloadDeps.bat
downloadData.bat
```

###### Linux
```
./downloadDeps.sh
./downloadData.sh
```

##### Start web server

The Python 3 Simple HTTP server is utilized below, but any web server will work.

###### Windows
```
python -m http.server
```

###### Linux
```
python3 -m http.server
```

##### Access web application

[http://localhost:8000/main.html](http://localhost:8000/main.html)