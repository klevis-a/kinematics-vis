import {WebGLRenderer, PerspectiveCamera, Quaternion, Vector3, Euler} from "./vendor/three.js/build/three.module.js";
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

function createRotations(){
    const quat1 = new Quaternion().setFromEuler(new Euler(Math.PI/4, 0, 0));
    const quat2 = new Quaternion().setFromEuler(new Euler(Math.PI/4, Math.PI/4, 0));
    const quat3 = new Quaternion().setFromEuler(new Euler(Math.PI/4, Math.PI/4, Math.PI/4));
    return [quat1, quat2, quat3];
}

function createEulerScenes(view1, view2, view3, view4, renderer, numFrames, camera, rotations) {
    const eulerScene1 = new EulerScene(view1, renderer, numFrames, camera, rotations);
    const eulerScene2 = new EulerScene(view2, renderer, numFrames, camera, rotations);
    const eulerScene3 = new EulerScene(view3, renderer, numFrames, camera, rotations);
    const eulerScene4 = new EulerScene(view4, renderer, numFrames, camera, rotations);
    return [eulerScene1, eulerScene2, eulerScene3, eulerScene4];
}

const numFrames = 100;
const framePeriod = 30;
const {canvas, views, view1, view2, view3, view4} = getEulerSceneElements();
const renderer = new WebGLRenderer({canvas: canvas});
renderer.setSize(views.clientWidth, views.clientHeight);
const camera = createCamera(view1);
const rotations = createRotations();
const eulerScenes = createEulerScenes(view1, view2, view3, view4, renderer, numFrames, camera, rotations);

const {playBtn, timeline, frameNumLbl} = getTimelineCtrlElements();
const animationHelper = new AnimationHelper(eulerScenes, numFrames, framePeriod, playBtn, timeline, frameNumLbl, renderer, views, true);

window.addEventListener('resize', onWindowResize);
const rotationStateRadios = document.stateCtrlForm.rotationStates;
const changeHandler = function () {
    animationHelper.goToStep(parseInt(this.value));
};
rotationStateRadios.forEach(radioBtn => radioBtn.addEventListener('change', changeHandler));
