import {divGeometry} from "./SceneHelpers.js";
import {WebGLRenderer, Euler, Matrix4, PerspectiveCamera, Quaternion, Vector3} from "./vendor/three.js/build/three.module.js";
import {AnimationHelper} from "./AnimationHelper.js";
import {EulerBoneScene} from "./EulerBoneScene.js";

export class SceneManager {
    static createRotations(){
        //extrinsic rotations
        const quat1Ext = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), Math.PI/4);
        const quat2Ext = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 3*Math.PI/8).multiply(quat1Ext);
        const quat3Ext = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), 3*Math.PI/4).multiply(quat2Ext);
        const eul1 = new Euler().setFromQuaternion(quat3Ext, 'XYZ');
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

    constructor(landmarksInfo, humerusGeometry) {
        this.landmarksInfo = landmarksInfo;
        this.humerusGeometry = humerusGeometry;
        this.activeDiv = null;
        this.numFrames = 100;
        this.framePeriod = 30; // in ms - meaning that each animation takes 3 seconds
        this.rotations = SceneManager.createRotations();
        this.getTimelineCtrlElements();
        this.getEulerSceneElements();
        this.getRotationStateRadios();
        this.createCamera();
        this.createRenderer();
        this.createEulerScenes();
        this.animationHelper = new AnimationHelper(this.eulerScenes, this.numFrames, this.framePeriod, this.playBtn, this.timeline, this.frameNumLbl, this.renderer, this.viewsContainer, true);
        this.addTrackBallControlsListeners();
        this.addKeyPress1234Listener();
        this.addDblClickDivListener();
        this.addWindowResizeListener();
        this.addRotationStateRadiosListener();
    }

    getTimelineCtrlElements() {
            this.playBtn = document.getElementById('playPauseCtrl');
            this.timeline = document.getElementById('timeline');
            this.frameNumLbl = document.getElementById('frameNum');
    }

    getEulerSceneElements() {
            this.canvas = document.getElementById('canvas');
            this.viewsContainer = document.getElementById('views');
            this.views = [document.getElementById('view1'), document.getElementById('view2'), document.getElementById('view3'), document.getElementById('view4')];
    }

    getRotationStateRadios() {
        this.rotationStateRadios = document.stateCtrlForm.rotationStates;
    }

    createCamera() {
        const {aspectRatio} = divGeometry(this.views[0]);
        const fov = 75;
        this.camera = new PerspectiveCamera(fov, aspectRatio, 0.1, 1000);
        this.camera.position.set(0, 0, 30);
        this.camera.updateProjectionMatrix();
    }

    createRenderer() {
        this.renderer = new WebGLRenderer({canvas: this.canvas});
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.viewsContainer.clientWidth, this.viewsContainer.clientHeight);
    }

    createEulerScenes() {
        this.scenesMap = new Map();
        this.views.forEach((view, idx) => this.scenesMap.set(view.id, new EulerBoneScene(view, this.renderer, this.numFrames, this.camera, this.rotations[idx], this.humerusGeometry, this.landmarksInfo)), this);
        this.eulerScenes = Array.from(this.scenesMap.values());
    }

    addTrackBallControlsListeners() {
        const startEventListener = event => this.animationHelper.setCurrentControl(event.target);
        const endEventListener = event => {
            this.eulerScenes.forEach(eulerScene => eulerScene.controls.target.copy(event.target.target));
        };
        this.eulerScenes.forEach(eulerScene => eulerScene.controls.addEventListener('start', startEventListener));
        this.eulerScenes.forEach(eulerScene => eulerScene.controls.addEventListener('end', endEventListener));
    }

    addKeyPress1234Listener() {
        document.addEventListener('keypress', event => {
            switch (event.keyCode) {
                case 49:
                    this.animationHelper.goToStep(1);
                    this.animationHelper.setFrame(0);
                    this.animationHelper.TimelineController.updateTimeLine(0);
                    this.rotationStateRadios[0].checked = true;
                    this.rotationStateRadios[0].focus();
                    break;
                case 50:
                    this.animationHelper.goToStep(1);
                    this.animationHelper.setFrame(this.numFrames);
                    this.animationHelper.TimelineController.updateTimeLine(this.numFrames);
                    this.rotationStateRadios[0].checked = true;
                    this.rotationStateRadios[0].focus();
                    break;
                case 51:
                    this.animationHelper.goToStep(2);
                    this.animationHelper.setFrame(this.numFrames);
                    this.animationHelper.TimelineController.updateTimeLine(this.numFrames);
                    this.rotationStateRadios[1].checked = true;
                    this.rotationStateRadios[1].focus();
                    break;
                case 52:
                    this.animationHelper.goToStep(3);
                    this.animationHelper.setFrame(this.numFrames);
                    this.animationHelper.TimelineController.updateTimeLine(this.numFrames);
                    this.rotationStateRadios[2].checked = true;
                    this.rotationStateRadios[2].focus();
                    break;
            }
        });
    }

    addDblClickDivListener() {
        const sceneManager = this;
        const dblClickListener = function () {
            if (sceneManager.activeDiv == null) {
                sceneManager.activeDiv = this;
                sceneManager.views.forEach(view => {
                    if (view.id === this.id) {
                        view.className = 'full';
                    }
                    else {
                        view.className = 'zero';
                    }
                });
                sceneManager.animationHelper.setActiveScene(sceneManager.scenesMap.get(this.id));
            } else {
                sceneManager.activeDiv = null;
                sceneManager.views.forEach(view => view.className='quarter');
                sceneManager.animationHelper.setActiveScene(null);
            }

        };
        sceneManager.views.forEach(view => view.addEventListener('dblclick', dblClickListener));
    }

    addWindowResizeListener() {
        window.addEventListener('resize', () => {
            this.renderer.setSize(this.viewsContainer.clientWidth, this.viewsContainer.clientHeight);
            this.eulerScenes.forEach(eulerScene => eulerScene.updateCamera());
        });
    }

    addRotationStateRadiosListener() {
        const animationHelper = this.animationHelper;
        const changeHandler = function () {
            animationHelper.goToStep(parseInt(this.value));
        };
        this.rotationStateRadios.forEach(radioBtn => radioBtn.addEventListener('change', changeHandler));
    }
}