import {WebGLRenderer, PerspectiveCamera} from "./vendor/three.js/build/three.module.js";
import {EulerScene} from "./EulerScene.js";
import {AnimationHelper} from "./AnimationHelper.js";
import {divGeometry} from "./SceneHelpers.js";

function getTimelineCtrlElements() {
    return {
        playBtn: document.getElementById('playPauseCtrl'),
        timeline: document.getElementById('timeline'),
        frameNumLbl: document.getElementById('frameNum')
    }
}

function getEulerSceneElements() {
    return {
        canvas: document.getElementById('canvas'),
        views: document.getElementById('views'),
        view1: document.getElementById('view1'),
        view2: document.getElementById('view2'),
        view3: document.getElementById('view3'),
        view4: document.getElementById('view4')
    }
}

function onWindowResize() {
    renderer.setSize(views.clientWidth, views.clientHeight);
    eulerScenes.forEach(eulerScene => eulerScene.updateCamera());
}

function createCamera(view) {
    const {aspectRatio} = divGeometry(view);
    const fov = 75;
    const camera = new PerspectiveCamera(fov, aspectRatio, 0.1, 100);
    camera.position.set(0, 0, 30);
    camera.updateProjectionMatrix();
    return camera;
}

const numFrames = 100;
const framePeriod = 30;
const {canvas, views, view1, view2, view3, view4} = getEulerSceneElements();
const renderer = new WebGLRenderer({canvas: canvas});
renderer.setSize(views.clientWidth, views.clientHeight);
const camera = createCamera(view1);
const eulerScene1 = new EulerScene(view1, renderer, numFrames, camera);
const eulerScene2 = new EulerScene(view2, renderer, numFrames, camera);
const eulerScene3 = new EulerScene(view3, renderer, numFrames, camera);
const eulerScene4 = new EulerScene(view4, renderer, numFrames, camera);
const eulerScenes = [eulerScene1, eulerScene2, eulerScene3, eulerScene4];
const {playBtn, timeline, frameNumLbl} = getTimelineCtrlElements();
window.addEventListener('resize', onWindowResize);
const animationHelper = new AnimationHelper(eulerScenes, numFrames, framePeriod, playBtn, timeline, frameNumLbl, renderer, views, true);
