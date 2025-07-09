'use strict';

import {Matrix4, Quaternion, Vector3} from "three";
import {AnglesVisualizationSVD, Euler_xzy_angle_geometry, Euler_yxy_angle_geometry} from "./EulerAnglesGeometry.js";
import {EulerScene} from "./EulerScene.js";
import {EulerSceneSimultaneous} from "./EulerSceneSimultaneous.js";
import {enableBone} from "./EulerScene_Bone.js";
import {enableSphere} from "./EulerScene_Sphere.js";
import {enableAngleVis, updateAxialRotVis_Euler, updateAxialRotVis_SwingTwist, updateAxialRotVis_ShortestPath} from "./EulerScene_AngleVis.js";
import {enableAxialRot, AXIAL_ROT_METHODS} from "./EulerScene_Axial.js";
import {EulerSceneAnimationHelper} from "./EulerSceneAnimationHelper.js";
import {generateUUID} from "./JSHelpers.js";
import {BaseView} from "./BaseView.js";
import {HUMERUS_BASE} from "./RotationHelper.js";
import {enableSphereArea, update_area_vis_xzy, update_area_vis_yxy} from "./EulerScene_SphereAreaVis.js";
import {HumerusAngVelocityScene} from "./HumerusAngVelocityScene";
import {angularVelocity} from "./RotDecompositions.js";


export class HumerusViewAngVelocity extends BaseView {

    constructor(renderer, rotationHelper, humerusGeometry, humerusLength, humerusBase) {
        super();
        this.renderer = renderer;
        this.rotationHelper = rotationHelper;
        this.setHumerusBase(humerusBase);
        this.humerusGeometry = humerusGeometry;
        this.humerusLength = humerusLength;
        this.createDivElements();
        this.angVelocityScene = new HumerusAngVelocityScene(this.scene_div, this.renderer, humerusGeometry, humerusLength);
        this.sceneManagerEventListeners = new Map();
        this.animationHelper = {CurrentAnimationFnc: (t) => {}};
        this.setFrame(0)
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
        this.angVelocityScene.createCamera()
        this.angVelocityScene.createControls();
    }

    initializeVisualOptions(viewManager) {
    }

    get viewGeometry() {
        return this.angVelocityScene.viewGeometry;
    }

    renderSceneGraph() {
        this.angVelocityScene.renderSceneGraph();
    }

    get controls() {
        return this.angVelocityScene.controls;
    }

    updateControls() {
        this.angVelocityScene.controls.update();
    }

    updateCamera() {
        this.angVelocityScene.updateCamera()
    }

    previewFrame(frameNum) {
        this.angVelocityScene.humerus.quaternion.copy(this.humerusQuat(frameNum));
        this.angVelocityScene.angVelocityVector.quaternion.copy(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), this.angVelocity[frameNum].normalize()))
    }

    setFrame(frameNum) {
        this.previewFrame(frameNum);
    }

    dispose() {
        this.angVelocityScene.dispose();
    }

    subscribeEvents(viewManager) {
        // humuerus base change
        const humerusBaseChangeListener = event => {
            this.setHumerusBase(event.humerusBase);
            this.setFrame(event.frameNum)
        };
        viewManager.addEventListener('humerusBase', humerusBaseChangeListener);
        this.sceneManagerEventListeners.set('humerusBase', humerusBaseChangeListener);
    }

    setHumerusBase(base) {
        switch (base) {
            case HUMERUS_BASE.TORSO:
                this.humerusRotation = (method_name, frameNum) => this.rotationHelper.humerusRotation_torso(method_name, frameNum);
                this.humerusQuat = frameNum => this.rotationHelper.humerusQuat_torso(frameNum);
                this.angVelocity = angularVelocity(this.rotationHelper.th_rot_mat, this.rotationHelper.trajectory.FramePeriod)
                break;
            case HUMERUS_BASE.SCAPULA:
                this.humerusRotation = (method_name, frameNum) => this.rotationHelper.humerusRotation_scapula(method_name, frameNum);
                this.humerusQuat = frameNum => this.rotationHelper.humerusQuat_scapula(frameNum);
                this.angVelocity = angularVelocity(this.rotationHelper.gh_rot_mat, this.rotationHelper.trajectory.FramePeriod)
                break;
            default:
                this.humerusRotation = (method_name, frameNum) => this.rotationHelper.humerusRotation_torso(method_name, frameNum);
                this.humerusQuat = frameNum => this.rotationHelper.humerusQuat_torso(frameNum);
        }
    }
}
