mkdir js\vendor
mkdir js\vendor\three.js
mkdir js\vendor\three.js\build
mkdir js\vendor\three.js\examples
mkdir js\vendor\three.js\examples\jsm
mkdir js\vendor\three.js\examples\jsm\controls
mkdir js\vendor\three.js\examples\jsm\utils
mkdir js\vendor\three.js\examples\jsm\loaders
mkdir js\vendor\three.js\examples\jsm\libs
curl https://cdn.jsdelivr.net/npm/google-palette@1.1.0/palette.min.js --output js\vendor\palette.min.js
curl https://cdn.jsdelivr.net/npm/papaparse@5.3.0/papaparse.min.js --output js\vendor\papaparse.min.js
curl https://cdn.plot.ly/plotly-1.57.0.min.js --output js\vendor\plotly.min.js
curl https://cdn.jsdelivr.net/npm/svd-js@1.1.1/build-es/svd.js --output js\vendor\svd.js
curl https://cdn.jsdelivr.net/npm/three@0.116.0/build/three.module.js --output js\vendor\three.js\build\three.module.js
curl https://cdn.jsdelivr.net/npm/three@0.116.0/examples/jsm/controls/TrackballControls.js --output js\vendor\three.js\examples\jsm\controls\TrackballControls.js
curl https://cdn.jsdelivr.net/npm/three@0.116.0/examples/jsm/utils/BufferGeometryUtils.js --output js\vendor\three.js\examples\jsm\utils\BufferGeometryUtils.js
curl https://cdn.jsdelivr.net/npm/three@0.116.0/examples/jsm/loaders/STLLoader.js --output js\vendor\three.js\examples\jsm\loaders\STLLoader.js
curl https://cdn.jsdelivr.net/npm/three@0.116.0/examples/jsm/libs/dat.gui.module.js --output js\vendor\three.js\examples\jsm\libs\dat.gui.module.js
