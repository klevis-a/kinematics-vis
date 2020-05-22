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
    //extrinsic rotations
    const quat1Ext = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI/4);
    const quat2Ext = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI/4).multiply(quat1Ext);
    const quat3Ext = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), Math.PI/4).multiply(quat2Ext);
    const eul = new Euler().setFromQuaternion(quat3Ext);
    //intrinsic rotations
    const quat1 = new Quaternion().setFromEuler(new Euler(eul.x, 0, 0));
    const quat2 = new Quaternion().setFromEuler(new Euler(eul.x, eul.y, 0));
    const quat3 = new Quaternion().setFromEuler(new Euler(eul.x, eul.y, eul.z));
    return [
        [quat1Ext, quat2Ext, quat3Ext],
        [quat1, quat2, quat3],
        [quat1Ext, quat2Ext, quat3Ext],
        [quat1, quat2, quat3]];
}

function createEulerScenes(view1, view2, view3, view4, renderer, numFrames, camera, rotations) {
    const eulerScene1 = new EulerScene(view1, renderer, numFrames, camera, rotations[0]);
    const eulerScene2 = new EulerScene(view2, renderer, numFrames, camera, rotations[1]);
    const eulerScene3 = new EulerScene(view3, renderer, numFrames, camera, rotations[2]);
    const eulerScene4 = new EulerScene(view4, renderer, numFrames, camera, rotations[3]);
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
const startEventListener = event => animationHelper.setCurrentControl(event.target);
const endEventListener = event => {
  eulerScenes.forEach(eulerScene => eulerScene.controls.target.copy(event.target.target));
};
eulerScenes.forEach(eulerScene => eulerScene.controls.addEventListener('start', startEventListener));
eulerScenes.forEach(eulerScene => eulerScene.controls.addEventListener('end', endEventListener));

window.addEventListener('resize', onWindowResize);
const rotationStateRadios = document.stateCtrlForm.rotationStates;
const changeHandler = function () {
    animationHelper.goToStep(parseInt(this.value));
};
rotationStateRadios.forEach(radioBtn => radioBtn.addEventListener('change', changeHandler));
document.addEventListener('keypress', event => {
   switch (event.keyCode) {
       case 49:
           animationHelper.goToStep(1);
           animationHelper.setFrame(0);
           animationHelper.TimelineController.updateTimeLine(0);
           rotationStateRadios[0].checked = true;
           break;
       case 50:
           animationHelper.goToStep(1);
           animationHelper.setFrame(numFrames);
           animationHelper.TimelineController.updateTimeLine(numFrames);
           rotationStateRadios[0].checked = true;
           break;
       case 51:
           animationHelper.goToStep(2);
           animationHelper.setFrame(numFrames);
           animationHelper.TimelineController.updateTimeLine(numFrames);
           rotationStateRadios[1].checked = true;
           break;
       case 52:
           animationHelper.goToStep(3);
           animationHelper.setFrame(numFrames);
           animationHelper.TimelineController.updateTimeLine(numFrames);
           rotationStateRadios[2].checked = true;
           break;
   }
});
