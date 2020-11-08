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
import {removeAllChildNodes} from "./JSHelpers.js";

export class SceneManager {

    constructor(landmarksInfo, timeSeriesInfo, humerusGeometry) {
        this.landmarksInfo = landmarksInfo;
        this.timeSeriesInfo = timeSeriesInfo;
        this.humerusGeometry = humerusGeometry;
        this.activeDiv = null;
        this.numFrames = 100; // this dictates the number of frames for each animation - not the number of frames in the capture
        this.framePeriod = 10; // in ms - meaning that each animation takes 1 seconds
        this.anglesVisLayer = 1;
        this.svdDecompClass = svdDecomp(this.timeSeriesInfo);
        this.methods = this.decompMethods();
        this.initialSceneLayout = new Map([['view1', 'EULER_YXY'], ['view2', 'SVD'], ['view3', 'ONE_STEP'], ['view4', 'TWO_STEP']]);
        this.normalizeHumerusGeometry();
        this.humerusLength = new Vector3().subVectors(this.landmarksInfo.humerus.hhc,
            new Vector3().addVectors(this.landmarksInfo.humerus.me, this.landmarksInfo.humerus.le).multiplyScalar(0.5)).length();
        this.getEulerSceneElements();
        this.getCaptureFrameCtrlElements();
        this.createCamera();
        this.createRenderer();
        this.createEulerScenes();
        this.createMethodDropdowns();
        this.frameSelectorController = new FrameSelectorController(this.frameTimeline, this.frameFrameNum, this.frameGoCtrl,
            this.timeSeriesInfo.NumFrames, (frameNum) => this.updateHumerusInScenes(frameNum), (frameNum) => this.updateEulerScenesToFrame(frameNum));
        this.addTrackBallControlsListeners();
        this.addDblClickDivListener();
        this.addWindowResizeListener();
        this.createOptionsGUI();
        this.render();
    }

    decompMethods() {
        return new Map([
            ['EULER_YXY', {
                decomp_method: (frameQuat) => {
                    const frameMat = new Matrix4().makeRotationFromQuaternion(frameQuat);
                    const eulerDecomp = new EulerDecomposition_RY$$_RX$_RY(frameMat);
                    return eulerDecomp.R3$$_R2$_R1;
                },
                angle_vis_method: Euler_yxy_angle_geometry.createAngleObjects,
                axial_rot_method: AXIAL_ROT_METHODS.EULER,
                friendly_name: "Euler yx'y''",
                north_pole: new Vector3(0, 1, 0)
            }],

            ['EULER_XZY', {
                decomp_method: (frameQuat) => {
                    const frameMat = new Matrix4().makeRotationFromQuaternion(frameQuat);
                    const eulerDecomp = new EulerDecomposition_RY$$_RZ$_RX(frameMat);
                    return eulerDecomp.R3$$_R2$_R1;
                },
                angle_vis_method: Euler_xzy_angle_geometry.createAngleObjects,
                axial_rot_method: AXIAL_ROT_METHODS.EULER,
                friendly_name: "Cardan xz'y''",
                north_pole: new Vector3(1, 0, 0)
            }],

            ['SVD', {
                decomp_method: (frameQuat) => {
                    const svdDecomp = new this.svdDecompClass(frameQuat);
                    return svdDecomp.rotationSequence;
                },
                angle_vis_method: AnglesVisualizationSVD.createAngleObjects,
                axial_rot_method: AXIAL_ROT_METHODS.SVD,
                friendly_name: "SVD",
                north_pole: new Vector3(0, 1, 0)
            }],

            ['ONE_STEP', {
                decomp_method: (frameQuat) => {
                    const oneStepDecomp = new OneStep(frameQuat);
                    return oneStepDecomp.rotationSequence;
                },
                angle_vis_method: Euler_yxy_angle_geometry.createAngleObjects,
                axial_rot_method: AXIAL_ROT_METHODS.ONE_STEP,
                friendly_name: "One Step",
                north_pole: new Vector3(0, 1, 0)
            }],

            ['TWO_STEP', {
                decomp_method: (frameQuat) => {
                    const frameMat = new Matrix4().makeRotationFromQuaternion(frameQuat);
                    const axialDecomp = new AxialDecomposition(frameQuat, new Vector3().setFromMatrixColumn(frameMat,1));
                    return axialDecomp.rotationSequence;
                },
                angle_vis_method: Euler_yxy_angle_geometry.createAngleObjects,
                axial_rot_method: AXIAL_ROT_METHODS.TWO_STEP,
                friendly_name: "Two Step",
                north_pole: new Vector3(0, 1, 0)
            }]
        ]);
    }

    getFrameQuat(frameNum){
        return  this.timeSeriesInfo.torsoOrientQuat(frameNum).conjugate().multiply(this.timeSeriesInfo.humOrientQuat(frameNum));
    }

    createEulerScenes() {
        this.scenesMap = new Map();
        this.initialSceneLayout.forEach((method_name, view_id) => {
            const view = document.getElementById(view_id);
            const method_info = this.methods.get(method_name);
            const [scene, animationHelper] = this.createEulerScene(view, method_info);

            this.scenesMap.set(view_id, {
                view: view,
                scene: scene,
                decomp_method: method_info.decomp_method,
                animation_helper: animationHelper
            });
        });
    }

    createEulerScene(view, method_info, frameNum=0) {
        const scene = new EulerBoneScene(view, view.getElementsByClassName('trackball_div')[0], this.renderer,
            this.numFrames, this.camera, this.humerusGeometry, this.humerusLength);
        enableSphere(scene);
        // enableAngleVis should be called after enableSphere in order to get the sphere to show up when the angle
        // visualization checkbox is checked
        enableAngleVis(scene, this.anglesVisLayer, method_info.angle_vis_method);
        enableAxialRot(scene, method_info.axial_rot_method);
        scene.initialize(method_info.decomp_method(this.getFrameQuat(frameNum)));
        scene.goToStep(scene.currentStep);
        scene.changeSphere(method_info.north_pole);
        const animationHelper = new ViewAnimationHelper(view.getElementsByClassName('view_controls')[0], scene, this.numFrames, this.framePeriod);
        return [scene, animationHelper];
    }

    changeEulerScene(view_id, method_name) {
        let scene_obj = this.scenesMap.get(view_id);
        const view = scene_obj.view;
        const method_info = this.methods.get(method_name);
        cancelAnimationFrame(this.animationHandle);
        removeAllChildNodes(scene_obj.animation_helper.CtrlDiv);
        const [scene, animationHelper] = this.createEulerScene(view, method_info, this.frameSelectorController.Timeline.value - 1);

        this.scenesMap.set(view_id, {
            view: view,
            scene: scene,
            decomp_method: method_info.decomp_method,
            animation_helper: animationHelper
        });

        scene_obj = null;

        this.render();
    }

    createMethodDropdowns() {
        this.initialSceneLayout.forEach((decomp_method, view_id) => {
            const view = document.getElementById(view_id);
            const selectorDiv = view.getElementsByClassName('method_selector')[0];
            const selector = selectorDiv.appendChild(document.createElement('select'));
            selector.addEventListener('change', e => {
                this.changeEulerScene(view_id, e.target.value);
            });

            this.methods.forEach((method, method_name) => {
               const option = selector.appendChild(document.createElement('option'));
               option.setAttribute('value', method_name);
               option.innerHTML = method.friendly_name;
               if (decomp_method === method_name) {
                   option.setAttribute('selected', 'selected');
               }
            });
        });
    }

    updateHumerusInScenes(frameNum) {
        this.scenesMap.forEach(scene_obj  => scene_obj.scene.humerus.quaternion.copy(
            this.timeSeriesInfo.torsoOrientQuat(frameNum).conjugate().multiply(this.timeSeriesInfo.humOrientQuat(frameNum))));
    }

    updateEulerScenesToFrame(frameNum) {
        const frameQuat = this.getFrameQuat(frameNum);
        this.scenesMap.forEach(scene_obj => {
            scene_obj.scene.reset(scene_obj.decomp_method(frameQuat));
            scene_obj.animation_helper.goToStep(scene_obj.scene.currentStep);
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
        this.views = [document.getElementById('view1'), document.getElementById('view2'), document.getElementById('view3'), document.getElementById('view4')];
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

    updateCamera() {
        const {aspectRatio} = divGeometry(this.views[0]);
        this.camera.aspect = aspectRatio;
        this.camera.updateProjectionMatrix();
    }

    createRenderer() {
        this.renderer = new WebGLRenderer({canvas: this.canvas});
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.viewsContainer.clientWidth, this.viewsContainer.clientHeight);
    }

    render(time) {
        this.scenesMap.forEach(scene_obj => scene_obj.animation_helper.CurrentAnimationFnc(time));
        if (this.ActiveScene == null) {
            this.renderer.setScissorTest(true);
            this.scenesMap.forEach(scene_obj => {
                const {contentLeft: left, contentTop: top, contentWidth: width, contentHeight: height} = scene_obj.scene.viewGeometry;
                const {contentHeight: parentHeight} = divGeometry(this.viewsContainer);
                scene_obj.scene.renderer.setScissor(left, parentHeight-top-height, width, height);
                scene_obj.scene.renderer.setViewport(left, parentHeight-top-height, width, height);
                if (this.CurrentControl != null) this.CurrentControl.update();
                scene_obj.scene.renderSceneGraph();
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
        this.animationHandle = requestAnimationFrame((t) => this.render(t));
    }

    addTrackBallControlsListeners() {
        const startEventListener = event => this.CurrentControl= event.target;
        const endEventListener = event => {
            this.scenesMap.forEach(scene_obj => scene_obj.scene.controls.target.copy(event.target.target));
        };
        this.scenesMap.forEach(scene_obj => scene_obj.scene.controls.addEventListener('start', startEventListener));
        this.scenesMap.forEach(scene_obj => scene_obj.scene.controls.addEventListener('end', endEventListener));
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
                sceneManager.ActiveScene = sceneManager.scenesMap.get(this.id).scene;
            } else {
                sceneManager.activeDiv = null;
                sceneManager.views.forEach(view => {
                    view.className='quarter';
                    view.style.display = 'block';
                });
                sceneManager.ActiveScene = null;
            }
            // there is only one camera in order to enable linking between the scenes
            sceneManager.updateCamera();
        };
        this.views.forEach(view => view.addEventListener('dblclick', dblClickListener));
    }

    addWindowResizeListener() {
        window.addEventListener('resize', () => {
            this.renderer.setSize(this.viewsContainer.clientWidth, this.viewsContainer.clientHeight);
            // there is only one camera in order to enable linking between the scenes
            this.updateCamera();
        });
    }

    createOptionsGUI() {
        const guiOptions = {
            showAllHumeri: false,
            showAngles: false
        };
        this.optionsGUI = new GUI({resizable : false, name: 'debugGUI', closeOnTop: true});
        this.optionsGUI.add(guiOptions, 'showAllHumeri').name('Prior Steps Humeri').onChange(value => {
            this.scenesMap.forEach(scene_obj => {
                scene_obj.scene.priorStepHumeriVisible = value;
                scene_obj.scene.updateHumeriBasedOnStep();
            });
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