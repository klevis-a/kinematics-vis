'use strict';

import {generateUUID} from "./JSHelpers.js";
import {HumerusScapulaScene} from "./HumerusScapulaScene.js";
import {BaseView} from "./BaseView.js";

export class PreviewView extends BaseView{
    constructor(renderer, rotationHelper, humerusGeometry, scapulaGeometry, humerusLength) {
        super();
        this.renderer = renderer;
        this.rotationHelper = rotationHelper;
        this.humerusGeometry = humerusGeometry;
        this.scapulaGeometry = scapulaGeometry;
        this.humerusLength = humerusLength;
        this.createDivElements();
        this.humScapScene = new HumerusScapulaScene(this.scene_div, this.renderer, this.humerusGeometry, this.scapulaGeometry, this.humerusLength);
        this.sceneManagerEventListeners = new Map();
        this.animationHelper = {CurrentAnimationFnc: (t) => {}};
        this.setFrame(0);
        this.humScapScene.addEllipsoid();
    }

    createDivElements() {
        this.uuid = generateUUID();
        this.parent_div = document.createElement('div');
        this.parent_div.setAttribute('class', 'view_div');
        this.parent_div.setAttribute('id', this.uuid);
        this.scene_div = this.parent_div.appendChild(document.createElement('div'));
        this.scene_div.setAttribute('class', 'scene_div');
        this.scene_div.setAttribute('id', this.uuid + '_scene');
    }

    postDomAttach(viewManager) {
        this.humScapScene.createCamera();
        this.humScapScene.createControls();
    }

    initializeVisualOptions(viewManager) {
    }

    get viewGeometry() {
        return this.humScapScene.viewGeometry;
    }

    renderSceneGraph() {
        this.humScapScene.renderSceneGraph();
    }

    get controls() {
        return this.humScapScene.controls;
    }

    updateControls() {
        this.humScapScene.controls.update();
    }

    updateCamera() {
        this.humScapScene.updateCamera();
    }

    previewFrame(frameNum) {
        this.humScapScene.humerus.quaternion.copy(this.rotationHelper.humerusQuat_torso(frameNum));
        this.humScapScene.humerus.position.copy(this.rotationHelper.humerusPos_torso(frameNum));
        this.humScapScene.scapula.quaternion.copy(this.rotationHelper.scapQuat(frameNum));
        this.humScapScene.scapula.position.copy(this.rotationHelper.scapPos(frameNum));
    }

    setFrame(frameNum) {
        this.previewFrame(frameNum);
    }

    dispose() {
        this.humScapScene.dispose();
    }
}
