'use strict';

import {enableBone} from "./EulerScene_Bone.js";
import {EulerSceneAnimationHelper} from "./EulerSceneAnimationHelper.js";
import {generateUUID} from "./JSHelpers.js";
import {BaseView} from "./BaseView.js";
import {EulerScene} from "./EulerScene.js";


export class ScapulaView extends BaseView{
    constructor(renderer, rotationHelper, scapulaGeometry, numAnimFrames=100, framePeriod=10) {
        super();
        this.renderer = renderer;
        this.rotationHelper = rotationHelper;
        this.numAnimFrames = numAnimFrames;
        this.framePeriod = framePeriod;
        this.scapulaGeometry = scapulaGeometry;
        this.createDivElements();
        this.createEulerScene();
        this.sceneManagerEventListeners = new Map();
    }

    createEulerScene() {
        this.eulerScene = new EulerScene(this.scene_div, this.renderer, this.numAnimFrames);
        // Enabling the various components of the animations should be done in the order below. The EventDispatcher
        // dispatches event in the order that they are added (and in a single-threaded fashion). Although the features
        // will largely work if they are not added in the correct order, there might be unforeseen bugs.
        enableBone(this.eulerScene, this.scapulaGeometry);
        this.eulerScene.initialize(this.rotationHelper.scapulaRotation('SCAP_EULER_YXZ', 0));
        this.eulerScene.goToStep(this.eulerScene.currentStep);
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
        this.eulerScene.createCamera();
        this.eulerScene.createControls();
    }

    initializeVisualOptions(viewManager) {
        this.showTriadsArcs(viewManager.guiOptions.showTriadsArcs);
        this.priorStepHumeriVisible(viewManager.guiOptions.showAllBones);
        this.toggleBodyPlaneVisibility(viewManager.guiOptions.showBodyPlanes);
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
        this.eulerScene.controls.update();
    }

    updateCamera() {
        this.eulerScene.camera.update();
    }

    previewFrame(frameNum) {
        this.eulerScene.bone.quaternion.copy(this.rotationHelper.scapQuat(frameNum));
    }

    setFrame(frameNum) {
        this.previewFrame(frameNum);
        this.eulerScene.reset(this.rotationHelper.scapulaRotation('SCAP_EULER_YXZ', frameNum));
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
}
