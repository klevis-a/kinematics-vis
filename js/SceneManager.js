import {divGeometry} from "./SceneHelpers.js";
import {WebGLRenderer, Matrix4, PerspectiveCamera, Vector3} from "./vendor/three.js/build/three.module.js";
import {ViewAnimationHelper} from "./ViewAnimationHelper.js";
import {EulerBoneScene} from "./EulerBoneScene.js";
import {EulerDecomposition_RY$$_RX$_RY, EulerDecomposition_RY$$_RZ$_RX, AxialDecomposition, OneStep} from "./EulerDecompositions.js";
import {FrameSelectorController} from "./FrameSelectorController.js";
import {GUI} from "./vendor/three.js/examples/jsm/libs/dat.gui.module.js";
import "./EulerScene_AngleVis.js";
import {Euler_yxy_angle_geometry, Euler_xzy_angle_geometry, AnglesVisualizationSVD} from "./EulerAnglesGeometry.js";
import {svdDecomp} from "./EulerDecompositions.js";
import {AXIAL_ROT_METHODS, enableAxialRot} from "./EulerScene_Axial.js"
import {enableSphere} from "./EulerScene_Sphere.js";
import {enableAngleVis} from "./EulerScene_AngleVis.js";

export class SceneManager {

    constructor(landmarksInfo, timeSeriesInfo, humerusGeometry) {
        this.landmarksInfo = landmarksInfo;
        this.timeSeriesInfo = timeSeriesInfo;
        this.humerusGeometry = humerusGeometry;
        this.activeDiv = null;
        this.numFrames = 100; // this dictates the number of frames for each animation - not the number of frames in the capture
        this.framePeriod = 10; // in ms - meaning that each animation takes 1 seconds
        this.anglesVisLayer = 1;
        this.eulerDecompClass = EulerDecomposition_RY$$_RX$_RY;
        this.svdDecompClass = svdDecomp(this.timeSeriesInfo);
        this.normalizeHumerusGeometry();
        this.humerusLength = new Vector3().subVectors(this.landmarksInfo.humerus.hhc,
            new Vector3().addVectors(this.landmarksInfo.humerus.me, this.landmarksInfo.humerus.le).multiplyScalar(0.5)).length();
        this.getEulerSceneElements();
        this.getCaptureFrameCtrlElements();
        this.createCamera();
        this.createRenderer();
        this.createRotations(0);
        this.createEulerScenes();
        this.frameSelectorController = new FrameSelectorController(this.frameTimeline, this.frameFrameNum, this.frameGoCtrl,
            this.timeSeriesInfo.NumFrames, (frameNum) => this.updateHumerusInScenes(frameNum), (frameNum) => this.updateEulerScenesToFrame(frameNum));
        this.addTrackBallControlsListeners();
        this.addDblClickDivListener();
        this.addWindowResizeListener();
        this.createOptionsGUI();
        this.render();
    }

    createRotations(frameNum) {
        const frameQuat = this.timeSeriesInfo.torsoOrientQuat(frameNum).conjugate().multiply(this.timeSeriesInfo.humOrientQuat(frameNum));
        const frameMat = new Matrix4().makeRotationFromQuaternion(frameQuat);
        const eulerDecomp = new this.eulerDecompClass(frameMat);
        const axialDecomp = new AxialDecomposition(frameQuat, new Vector3().setFromMatrixColumn(frameMat,1));
        const svdDecomp = new this.svdDecompClass(frameQuat);
        const oneStepDecomp = new OneStep(frameQuat);
        this.rotations = [
            eulerDecomp.R3$$_R2$_R1,
            svdDecomp.rotationSequence,
            //eulerDecomp.R1_R2_R3,
            //eulerDecomp.R3$$_Rcombo,
            oneStepDecomp.rotationSequence,
            axialDecomp.rotationSequence
        ]
    }

    createEulerScenes() {
        this.scenesMap = new Map();
        this.viewAnimationsMap = new Map();
        this.eulerAnglesVisFnc = [Euler_yxy_angle_geometry.createAngleObjects, AnglesVisualizationSVD.createAngleObjects,
            Euler_yxy_angle_geometry.createAngleObjects, Euler_yxy_angle_geometry.createAngleObjects];
        this.axialRotMethods = [AXIAL_ROT_METHODS.EULER, AXIAL_ROT_METHODS.SVD, AXIAL_ROT_METHODS.ONE_STEP, AXIAL_ROT_METHODS.TWO_STEP];
        this.views.forEach((view) => {
            const scene = new EulerBoneScene(view, view.getElementsByClassName('trackball_div')[0], this.renderer,
                this.numFrames, this.camera, this.humerusGeometry, this.humerusLength);
            this.scenesMap.set(view.id, scene);
        });
        this.eulerScenes = Array.from(this.scenesMap.values());
        this.eulerScenes.forEach((eulerScene,idx) => {
            enableSphere(eulerScene);
            // enableAngleVis should be called after enableSphere in order to get the sphere to show up
            enableAngleVis(eulerScene, this.anglesVisLayer, this.eulerAnglesVisFnc[idx]);
            enableAxialRot(eulerScene, this.axialRotMethods[idx]);
            eulerScene.initialize(this.rotations[idx]);
            eulerScene.goToStep(eulerScene.currentStep);
        });
        this.views.forEach((view) => {
            this.viewAnimationsMap.set(view.id, new ViewAnimationHelper(view.getElementsByClassName('view_controls')[0], this.scenesMap.get(view.id), this.numFrames, this.framePeriod));
        });
        this.viewAnimations = Array.from(this.viewAnimationsMap.values());
    }

    updateHumerusInScenes(frameNum) {
        this.eulerScenes.forEach(eulerScene => eulerScene.humerus.quaternion.copy(
            this.timeSeriesInfo.torsoOrientQuat(frameNum).conjugate().multiply(this.timeSeriesInfo.humOrientQuat(frameNum))));
    }

    updateEulerScenesToFrame(frameNum) {
        this.createRotations(frameNum);
        this.eulerScenes.forEach((eulerScene,idx) => {
            eulerScene.reset(this.rotations[idx]);
            this.viewAnimations[idx].goToStep(eulerScene.currentStep);
        });
    }

    normalizeHumerusGeometry() {
        const hhc = this.landmarksInfo.humerus.hhc;
        const le = this.landmarksInfo.humerus.le;
        const me = this.landmarksInfo.humerus.me;
        const y_axis = new Vector3().addVectors(me, le).multiplyScalar(0.5).multiplyScalar(-1).add(hhc);
        const x_axis = new Vector3().subVectors(me, le).cross(y_axis);
        const z_axis = new Vector3().crossVectors(x_axis, y_axis);
        x_axis.normalize();
        y_axis.normalize();
        z_axis.normalize();
        const BB_T_H = new Matrix4().makeBasis(x_axis, y_axis, z_axis).setPosition(hhc);
        const H_T_BB = new Matrix4().getInverse(BB_T_H);
        this.humerusGeometry.applyMatrix4(H_T_BB);
    }

    getEulerSceneElements() {
        this.canvas = document.getElementById('canvas');
        this.viewsContainer = document.getElementById('views');
        this.views = [document.getElementById('view1'), document.getElementById('view2'),
            document.getElementById('view3'), document.getElementById('view4')];
    }

    getCaptureFrameCtrlElements() {
        this.frameTimeline = document.getElementById('captureFrameTimeline');
        this.frameFrameNum = document.getElementById('captureFrameNum');
        this.frameGoCtrl = document.getElementById('captureFrameGoCtrl');
    }

    createCamera() {
        const {aspectRatio} = divGeometry(this.views[0]);
        const fov = 75;
        this.camera = new PerspectiveCamera(fov, aspectRatio, 1, 2000);
        this.camera.position.set(-500, 0, 0);
        this.camera.updateProjectionMatrix();
    }

    createRenderer() {
        this.renderer = new WebGLRenderer({canvas: this.canvas});
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.viewsContainer.clientWidth, this.viewsContainer.clientHeight);
    }

    render(time) {
        this.viewAnimations.forEach((animationHelper) => animationHelper.CurrentAnimationFnc(time));
        if (this.ActiveScene == null) {
            this.renderer.setScissorTest(true);
            this.eulerScenes.forEach((eulerScene) => {
                const {contentLeft: left, contentTop: top, contentWidth: width, contentHeight: height} = eulerScene.viewGeometry;
                const {contentHeight: parentHeight} = divGeometry(this.viewsContainer);
                eulerScene.renderer.setScissor(left, parentHeight-top-height, width, height);
                eulerScene.renderer.setViewport(left, parentHeight-top-height, width, height);
                if (this.CurrentControl != null) this.CurrentControl.update();
                eulerScene.renderSceneGraph();
            });
        }
        else {
            this.renderer.setScissorTest(false);
            const {contentLeft: left, contentTop: top, contentWidth: width, contentHeight: height} = this.ActiveScene.viewGeometry;
            const {contentHeight: parentHeight} = divGeometry(this.viewsContainer);
            this.renderer.setViewport(left, parentHeight-top-height, width, height);
            if (this.CurrentControl != null) this.CurrentControl.update();
            this.ActiveScene.renderSceneGraph();
        }
        requestAnimationFrame((t) => this.render(t));
    }

    addTrackBallControlsListeners() {
        const startEventListener = event => this.CurrentControl= event.target;
        const endEventListener = event => {
            this.eulerScenes.forEach(eulerScene => eulerScene.controls.target.copy(event.target.target));
        };
        this.eulerScenes.forEach(eulerScene => eulerScene.controls.addEventListener('start', startEventListener));
        this.eulerScenes.forEach(eulerScene => eulerScene.controls.addEventListener('end', endEventListener));
    }

    addDblClickDivListener() {
        const sceneManager = this;
        const dblClickListener = function () {
            if (sceneManager.activeDiv == null) {
                sceneManager.activeDiv = this;
                sceneManager.views.forEach(view => {
                    if (view.id === this.id) {
                        view.className = 'full';
                        view.style.display = 'block';
                    }
                    else {
                        view.className = 'zero';
                        view.style.display = 'none';
                    }
                });
                sceneManager.ActiveScene = sceneManager.scenesMap.get(this.id);
            } else {
                sceneManager.activeDiv = null;
                sceneManager.views.forEach(view => {
                    view.className='quarter';
                    view.style.display = 'block';
                });
                sceneManager.ActiveScene = null;
            }

        };
        this.views.forEach(view => view.addEventListener('dblclick', dblClickListener));
        this.eulerScenes.forEach((scene) => scene.updateCamera());
    }

    addWindowResizeListener() {
        window.addEventListener('resize', () => {
            this.renderer.setSize(this.viewsContainer.clientWidth, this.viewsContainer.clientHeight);
            this.eulerScenes.forEach(eulerScene => eulerScene.updateCamera());
        });
    }

    createOptionsGUI() {
        const guiOptions = {
            showAllHumeri: false,
            decompMethod: "yx'y''",
            showAngles: false
        };
        this.optionsGUI = new GUI({resizable : false, name: 'debugGUI', closeOnTop: true});
        this.optionsGUI.add(guiOptions, 'showAllHumeri').name('Prior Steps Humeri').onChange(value => {
            this.eulerScenes.forEach(eulerScene => {
                eulerScene.priorStepHumeriVisible = value;
                eulerScene.updateHumeriBasedOnStep();
            });
        });
        this.optionsGUI.add(guiOptions, 'decompMethod', ["yx'y''", "xz'y''"]).name('Decomposition').onChange(value => {
            switch (value) {
                case "yx'y''":
                    this.eulerDecompClass = EulerDecomposition_RY$$_RX$_RY;
                    this.eulerScenes[0].anglesVisFnc = Euler_yxy_angle_geometry.createAngleObjects;
                    this.eulerScenes[0].changeSphere(new Vector3(0, 1, 0));
                    this.updateEulerScenesToFrame(this.frameSelectorController.Timeline.value-1);
                    break;
                case "xz'y''":
                    this.eulerDecompClass = EulerDecomposition_RY$$_RZ$_RX;
                    this.eulerScenes[0].anglesVisFnc = Euler_xzy_angle_geometry.createAngleObjects;
                    this.eulerScenes[0].changeSphere(new Vector3(1, 0, 0));
                    this.updateEulerScenesToFrame(this.frameSelectorController.Timeline.value-1);
                    break;
            }
        });
        this.optionsGUI.add(guiOptions, 'showAngles').name('Visualize Angles').onChange(value => {
            if (value) {
                this.camera.layers.set(this.anglesVisLayer);
            }
            else {
                this.camera.layers.set(0);
            }
        });
        this.optionsGUI.close();
        document.getElementById('datGUI').appendChild(this.optionsGUI.domElement);
    }
}