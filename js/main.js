import {WebGLRenderer, PerspectiveCamera, Quaternion, Vector3, Euler, Matrix4} from "./vendor/three.js/build/three.module.js";
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
        viewsContainer: document.getElementById('views'),
        views: [document.getElementById('view1'), document.getElementById('view2'), document.getElementById('view3'), document.getElementById('view4')]
    }
}

function onWindowResize() {
    renderer.setSize(viewsContainer.clientWidth, viewsContainer.clientHeight);
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
    const quat1Ext = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), Math.PI/4);
    const quat2Ext = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 3*Math.PI/8).multiply(quat1Ext);
    const quat3Ext = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), 3*Math.PI/4).multiply(quat2Ext);
    const eul1 = new Euler().setFromQuaternion(quat3Ext, 'XYZ');
    const eul2 = new Euler().setFromQuaternion(quat3Ext, 'YXZ');
    const eul3 = new Euler().setFromQuaternion(quat3Ext, 'ZXY');
    const eul4 = new Euler().setFromQuaternion(quat3Ext, 'ZYX');
    const eul5 = new Euler().setFromQuaternion(quat3Ext, 'YZX');
    const eul6 = new Euler().setFromQuaternion(quat3Ext, 'XZY');
    console.log(eul1);
    console.log(eul2);
    console.log(eul3);
    console.log(eul4);
    console.log(eul5);
    console.log(eul6);
    //intrinsic rotations
    const quat1Int = new Quaternion().setFromEuler(new Euler(eul1.x, 0, 0));
    const quat2Int = new Quaternion().setFromEuler(new Euler(eul1.x, eul1.y, 0));
    const quat3Int = new Quaternion().setFromEuler(new Euler(eul1.x, eul1.y, eul1.z));
    //combination 1
    const quat1Comb1 = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), eul1.y);
    const quat2Comb1 = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), eul1.x).multiply(quat1Comb1);
    const quat3Comb1 = new Quaternion().setFromAxisAngle(new Vector3().setFromMatrixColumn(new Matrix4().makeRotationFromQuaternion(quat2Comb1), 2), eul1.z).multiply(quat2Comb1);
    //combination 2
    const quat1Comb2 = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), eul1.z);
    const quat2Comb2 = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), eul1.x).multiply(quat1Comb2);
    const quat3Comb2 = new Quaternion().setFromAxisAngle(new Vector3().setFromMatrixColumn(new Matrix4().makeRotationFromQuaternion(quat1Int), 1), eul1.y).multiply(quat2Comb2);
    return [
        [quat1Ext, quat2Ext, quat3Ext],
        [quat1Int, quat2Int, quat3Int],
        [quat1Comb1, quat2Comb1, quat3Comb1],
        [quat1Comb2, quat2Comb2, quat3Comb2]];
}

function createEulerScenes(views, renderer, numFrames, camera, rotations) {
    const scenesMap = new Map();
    views.forEach((view, idx) => scenesMap.set(view.id, new EulerScene(view, renderer, numFrames, camera, rotations[idx])));
    return scenesMap;
}

//initialize
const numFrames = 100;
const framePeriod = 30;
const {canvas, viewsContainer, views} = getEulerSceneElements();
const renderer = new WebGLRenderer({canvas: canvas});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(viewsContainer.clientWidth, viewsContainer.clientHeight);
const camera = createCamera(views[0]);
const rotations = createRotations();
const scenesMap = createEulerScenes(views, renderer, numFrames, camera, rotations);
const eulerScenes = Array.from(scenesMap.values());
const {playBtn, timeline, frameNumLbl} = getTimelineCtrlElements();
const animationHelper = new AnimationHelper(eulerScenes, numFrames, framePeriod, playBtn, timeline, frameNumLbl, renderer, viewsContainer, true);

//event listeners for trackball controls
const startEventListener = event => animationHelper.setCurrentControl(event.target);
const endEventListener = event => {
  eulerScenes.forEach(eulerScene => eulerScene.controls.target.copy(event.target.target));
};
eulerScenes.forEach(eulerScene => eulerScene.controls.addEventListener('start', startEventListener));
eulerScenes.forEach(eulerScene => eulerScene.controls.addEventListener('end', endEventListener));

//window resize event listener
window.addEventListener('resize', onWindowResize);

//event listeners for rotation states
const rotationStateRadios = document.stateCtrlForm.rotationStates;
const changeHandler = function () {
    animationHelper.goToStep(parseInt(this.value));
};
rotationStateRadios.forEach(radioBtn => radioBtn.addEventListener('change', changeHandler));

//event listeners for 1,2,3,4
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

//event listeners for div double click
let activeDiv = null;
const dblClickListener = function () {
    if (activeDiv == null) {
        activeDiv = this;
        views.forEach(view => {
            if (view.id === this.id) {
                view.className = 'full';
            }
            else {
                view.className = 'zero';
            }
        });
        animationHelper.setActiveScene(scenesMap.get(this.id));
    } else {
        activeDiv = null;
        views.forEach(view => view.className='quarter');
        animationHelper.setActiveScene(null);
    }

};
views.forEach(view => view.addEventListener('dblclick', dblClickListener));