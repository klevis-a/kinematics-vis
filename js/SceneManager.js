import {divGeometry} from "./SceneHelpers.js";
import {WebGLRenderer, Euler, Matrix4, PerspectiveCamera, Quaternion, Vector3} from "./vendor/three.js/build/three.module.js";
import {AnimationHelper} from "./AnimationHelper.js";
import {EulerBoneScene} from "./EulerBoneScene.js";
import {EulerDecomposition_RY$$_RZ$_RX} from "./EulerDecompositions.js";
import * as THREE from "./vendor/three.js/build/three.module.js";

export class SceneManager {

    constructor(landmarksInfo, timeSeriesInfo, humerusGeometry) {
        this.landmarksInfo = landmarksInfo;
        this.timeSeriesInfo = timeSeriesInfo;
        this.humerusGeometry = humerusGeometry;
        this.activeDiv = null;
        this.numFrames = 100;
        this.framePeriod = 30; // in ms - meaning that each animation takes 3 seconds
        this.normalizeHumerusGeometry();
        this.getTimelineCtrlElements();
        this.getEulerSceneElements();
        this.getRotationStateRadios();
        this.createCamera();
        this.createRenderer();
        this.createRotations();
        this.createEulerScenes();
        this.animationHelper = new AnimationHelper(this.eulerScenes, this.numFrames, this.framePeriod, this.playBtn, this.timeline, this.frameNumLbl, this.renderer, this.viewsContainer, true);
        this.addTrackBallControlsListeners();
        this.addKeyPress1234Listener();
        this.addDblClickDivListener();
        this.addWindowResizeListener();
        this.addRotationStateRadiosListener();
    }

    normalizeHumerusGeometry() {
        const hhc = this.landmarksInfo.humerus.hhc;
        const le = this.landmarksInfo.humerus.le;
        const me = this.landmarksInfo.humerus.me;
        const y_axis = new THREE.Vector3().addVectors(me, le).multiplyScalar(0.5).multiplyScalar(-1).add(hhc);
        const x_axis = new THREE.Vector3().subVectors(me, le).cross(y_axis);
        const z_axis = new THREE.Vector3().crossVectors(x_axis, y_axis);
        x_axis.normalize();
        y_axis.normalize();
        z_axis.normalize();
        const BB_T_H = new THREE.Matrix4().makeBasis(x_axis, y_axis, z_axis).setPosition(hhc);
        const H_T_BB = new THREE.Matrix4().getInverse(BB_T_H);
        this.humerusGeometry.applyMatrix4(H_T_BB);
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

    createRotations() {
        const frame100Quat = this.timeSeriesInfo.torsoOrientQuat(150).conjugate().multiply(this.timeSeriesInfo.humOrientQuat(150));
        const frame100Mat = new Matrix4().makeRotationFromQuaternion(frame100Quat);
        const eulerDecomp = new EulerDecomposition_RY$$_RZ$_RX(frame100Mat);
        this.rotations = [
            eulerDecomp.R3$$_R2$_R1,
            eulerDecomp.R1_R2_R3,
            eulerDecomp.R3$$_R1_R2,
            eulerDecomp.R2$_R1_R3
        ]
    }

    createEulerScenes() {
        this.scenesMap = new Map();
        this.views.forEach((view, idx) => this.scenesMap.set(view.id, new EulerBoneScene(view, this.renderer, this.numFrames, this.camera, this.rotations[idx], this.humerusGeometry)), this);
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