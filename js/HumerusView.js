import {Vector3} from "./vendor/three.js/build/three.module.js";
import {AnglesVisualizationSVD, Euler_xzy_angle_geometry, Euler_yxy_angle_geometry} from "./EulerAnglesGeometry.js";
import {EulerScene} from "./EulerScene.js";
import {EulerSceneSimultaneous} from "./EulerSceneSimultaneous.js";
import {enableBone} from "./EulerScene_Bone.js";
import {enableSphere} from "./EulerScene_Sphere.js";
import {enableAngleVis} from "./EulerScene_AngleVis.js";
import {enableAxialRot, AXIAL_ROT_METHODS} from "./EulerScene_Axial.js";
import {EulerSceneAnimationHelper} from "./EulerSceneAnimationHelper.js";
import {generateUUID} from "./JSHelpers.js";
import {BaseView} from "./BaseView.js";
import {HUMERUS_BASE} from "./RotationHelper.js";


export class HumerusView extends BaseView{
    static METHODS = new Map([
       ['HUM_EULER_YXY', {
           angle_vis_method: Euler_yxy_angle_geometry.createAngleObjects,
           axial_rot_method: AXIAL_ROT_METHODS.EULER,
           north_pole: new Vector3(0, 1, 0),
           scene_class: EulerScene
           }],

       ['HUM_EULER_XZY', {
           angle_vis_method: Euler_xzy_angle_geometry.createAngleObjects,
           axial_rot_method: AXIAL_ROT_METHODS.EULER,
           north_pole: new Vector3(1, 0, 0),
           scene_class: EulerScene
           }],

       ['HUM_SVD', {
           angle_vis_method: AnglesVisualizationSVD.createAngleObjects,
           axial_rot_method: AXIAL_ROT_METHODS.SVD,
           north_pole: new Vector3(0, 1, 0),
           scene_class: EulerScene
           }],

       ['HUM_SHORTEST_PATH', {
           angle_vis_method: Euler_yxy_angle_geometry.createAngleObjects,
           axial_rot_method: AXIAL_ROT_METHODS.ONE_STEP,
           north_pole: new Vector3(0, 1, 0),
           scene_class: EulerScene
           }],

       ['HUM_SWING_TWIST', {
           angle_vis_method: Euler_yxy_angle_geometry.createAngleObjects,
           axial_rot_method: AXIAL_ROT_METHODS.SWING_TWIST,
           north_pole: new Vector3(0, 1, 0),
           scene_class: EulerScene
           }],

       ['HUM_SIMULTANEOUS', {
           angle_vis_method: Euler_yxy_angle_geometry.createAngleObjects,
           axial_rot_method: AXIAL_ROT_METHODS.SIMULTANEOUS,
           north_pole: new Vector3(0, 1, 0),
           scene_class: EulerSceneSimultaneous
           }]
       ]);

    constructor(camera, renderer, rotationHelper, method_name, humerusGeometry, humerusLength, anglesVisLayer, humerusBase, numAnimFrames=100, framePeriod=10) {
        super();
        this.camera = camera;
        this.renderer = renderer;
        this.rotationHelper = rotationHelper;
        this.setHumerusBase(humerusBase);
        this.anglesVisLayer = anglesVisLayer;
        this.method_name = method_name;
        this.numAnimFrames = numAnimFrames;
        this.framePeriod = framePeriod;
        this.humerusGeometry = humerusGeometry;
        this.humerusLength = humerusLength;
        this.createDivElements();
        this.method_info = HumerusView.METHODS.get(this.method_name);
        this.createEulerScene();
        this.sceneManagerEventListeners = new Map();
    }

    createEulerScene() {
        this.eulerScene = new this.method_info.scene_class(this.scene_div, this.renderer, this.numAnimFrames, this.camera);
        // humerus length is needed for visualizations
        this.eulerScene.humerusLength = this.humerusLength;
        // Enabling the various components of the animations should be done in the order below. The EventDispatcher
        // dispatches event in the order that they are added (and in a single-threaded fashion). Although the features
        // will largely work if they are not added in the correct order, there might be unforeseen bugs.
        enableBone(this.eulerScene, this.humerusGeometry);
        enableSphere(this.eulerScene);
        // enableAngleVis should be called after enableSphere in order to get the sphere to show up when the angle
        // visualization checkbox is checked
        enableAngleVis(this.eulerScene, this.anglesVisLayer, this.method_info.angle_vis_method);
        enableAxialRot(this.eulerScene, this.method_info.axial_rot_method);
        this.eulerScene.initialize(this.humerusRotation(this.method_name, 0));
        this.eulerScene.goToStep(this.eulerScene.currentStep);
        this.eulerScene.changeSphere(this.method_info.north_pole);
        this.animationHelper = new EulerSceneAnimationHelper(this.ctrlDiv, this.eulerScene, this.numAnimFrames, this.framePeriod);
    }

    createDivElements() {
        this.uuid = generateUUID();
        this.parent_div = document.createElement('div');
        this.parent_div.setAttribute('class', 'view_div');
        this.parent_div.setAttribute('id', this.uuid);
        this.scene_div = this.parent_div.appendChild(document.createElement('div'));
        this.scene_div.setAttribute('class', 'scene_div');
        this.scene_div.setAttribute('id', this.uuid + '_scene');
        this.ctrlDiv = this.parent_div.appendChild(document.createElement('div'));
        this.ctrlDiv.setAttribute('class', 'view_controls');
        this.ctrlDiv.setAttribute('id', this.uuid + '_ctrls');
    }

    postDomAttach(viewManager) {
        this.eulerScene.createControls();
        this.eulerScene.controls.addEventListener('start', viewManager.trackballStartEventListener);
        this.eulerScene.controls.addEventListener('end', viewManager.trackballEndEventListener);
    }

    initializeVisualOptions(viewManager) {
        this.showTriadsArcs(viewManager.guiOptions.showTriadsArcs);
        this.priorStepHumeriVisible(viewManager.guiOptions.showAllBones);
        this.toggleBodyPlaneVisibility(viewManager.guiOptions.showBodyPlanes);
        this.toggleSphereVisibility(viewManager.guiOptions.showSphere);
    }

    get viewGeometry() {
        return this.eulerScene.viewGeometry;
    }

    renderSceneGraph() {
        this.eulerScene.renderSceneGraph();
    }

    get controls() {
        return this.eulerScene.controls;
    }

    updateControls() {
    }

    updateCamera() {
    }

    previewFrame(frameNum) {
        this.eulerScene.bone.quaternion.copy(this.humerusQuat(frameNum));
    }

    setFrame(frameNum) {
        this.eulerScene.reset(this.humerusRotation(this.method_name, frameNum));
        this.animationHelper.goToStep(this.eulerScene.currentStep);
    }

    dispose() {
        this.eulerScene.dispose();
    }

    subscribeEvents(viewManager) {
        // triads/arcs visibility
        const triadsArcsVisibilityListener = event => this.showTriadsArcs(event.visibility);
        viewManager.addEventListener('showTriadsArcs', triadsArcsVisibilityListener);
        this.sceneManagerEventListeners.set('showTriadsArcs', triadsArcsVisibilityListener);

        // prior step humeri visibility
        const priorStepsHumeriVisibilityListener = event => this.priorStepHumeriVisible(event.visibility);
        viewManager.addEventListener('showAllBones', priorStepsHumeriVisibilityListener);
        this.sceneManagerEventListeners.set('showAllBones', priorStepsHumeriVisibilityListener);

        // body plane visibility
        const bodyPlanesVisibilityListener = event => this.toggleBodyPlaneVisibility(event.visibility);
        viewManager.addEventListener('showBodyPlanes', bodyPlanesVisibilityListener);
        this.sceneManagerEventListeners.set('showBodyPlanes', bodyPlanesVisibilityListener);

        // sphere visibility
        const sphereVisibilityListener = event => this.toggleSphereVisibility(event.visibility);
        viewManager.addEventListener('showSphere', sphereVisibilityListener);
        this.sceneManagerEventListeners.set('showSphere', sphereVisibilityListener);

        // humuerus base change
        const humerusBaseChangeListener = event => {
            this.setHumerusBase(event.humerusBase);
            this.setFrame(event.frameNum)
        };
        viewManager.addEventListener('humerusBase', humerusBaseChangeListener);
        this.sceneManagerEventListeners.set('humerusBase', humerusBaseChangeListener);
    }

    showTriadsArcs(flag) {
        this.eulerScene.triadsArcsVisible = flag;
        this.eulerScene.showTriadsArcs();
    }

    priorStepHumeriVisible(flag) {
        this.eulerScene.priorStepBonesVisible = flag;
        this.eulerScene.updateBonesBasedOnStep();
    }

    toggleBodyPlaneVisibility(flag) {
        this.eulerScene.toggleBodyPlaneVisibility(flag);
    }

    toggleSphereVisibility(flag) {
        this.eulerScene.toggleSphereVisibility(flag);
    }

    setHumerusBase(base) {
        switch (base) {
            case HUMERUS_BASE.TORSO:
                this.humerusRotation = (method_name, frameNum) => this.rotationHelper.humerusRotation_torso(method_name, frameNum);
                this.humerusQuat = frameNum => this.rotationHelper.humerusQuat_torso(frameNum);
                break;
            case HUMERUS_BASE.SCAPULA:
                this.humerusRotation = (method_name, frameNum) => this.rotationHelper.humerusRotation_scapula(method_name, frameNum);
                this.humerusQuat = frameNum => this.rotationHelper.humerusQuat_scapula(frameNum);
                break;
            default:
                this.humerusRotation = (method_name, frameNum) => this.rotationHelper.humerusRotation_torso(method_name, frameNum);
                this.humerusQuat = frameNum => this.rotationHelper.humerusQuat_torso(frameNum);
        }
    }
}
