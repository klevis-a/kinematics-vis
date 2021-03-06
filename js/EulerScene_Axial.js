'use strict';

import {MeshBasicMaterial, Mesh, Group, Vector3, CircleBufferGeometry, PlaneBufferGeometry,
    DoubleSide} from "three";
import {EulerScene} from "./EulerScene.js";

EulerScene.AXIAL_PLANE_MATERIAL = new MeshBasicMaterial({color: 0xffffff, side: DoubleSide, depthTest: false, visible: false});
EulerScene.XLINE_MATERIAL = new MeshBasicMaterial({color: 0x0000ff, side: DoubleSide, depthTest: false});
EulerScene.XLINE_MATERIAL_BLACK = new MeshBasicMaterial({color: 0x000000, side: DoubleSide, depthTest: false});

export const AXIAL_ROT_METHODS = {
    EULER: {
        step_update: updateAxialRotationStep_euler,
        frame_update: updateAxialRotationFrame_euler
    },

    SWING_TWIST: {
        step_update: updateAxialRotationStep_swingTwist,
        frame_update: updateAxialRotationFrame_swingTwist
    },

    ONE_STEP: {
        step_update: updateAxialRotationStep_shortestPath,
        frame_update: updateAxialRotationFrame_shortestPath
    },

    SVD: {
        step_update: updateAxialRotationStep_svd,
        frame_update: updateAxialRotationFrame_swingTwist
    },

    SIMULTANEOUS: {
        step_update: updateAxialRotationStep_simultaneous,
        frame_update: updateAxialRotationFrame_swingTwist
    }
};

export function initAxialRotation() {
    //this is the axial plane that simply goes along with the humerus
    this.axialPlane = new Mesh(this.PLANE_GEOMETRY, EulerScene.AXIAL_PLANE_MATERIAL);
    this.axialPlane.name = 'axialPlane';
    this.axialPlane.renderOrder = 2;
    this.axialPlane.position.set(0, 0, 0);
    this.axialPlane.translateY(-this.humerusLength);
    this.stepBones[0].add(this.axialPlane);

    this.xLine = new Mesh(this.THIN_LINE_GEOMETRY, EulerScene.XLINE_MATERIAL);
    this.xLine.name = 'xLine';
    this.xLine.visible = false;
    this.xLine.renderOrder = 4;
    this.xLine.rotateY(Math.PI/2);
    this.axialPlane.add(this.xLine);

    //this is the axial plane that simply goes along with the preview humerus
    this.axialPlaneHum = new Mesh(this.PLANE_GEOMETRY, EulerScene.AXIAL_PLANE_MATERIAL);
    this.axialPlaneHum.name = 'axialPlaneHum';
    this.axialPlaneHum.renderOrder = 2;
    this.axialPlaneHum.position.set(0, 0, 0);
    this.axialPlaneHum.translateY(-this.humerusLength);
    this.bone.add(this.axialPlaneHum);

    this.xLineHum = new Mesh(this.THIN_LINE_GEOMETRY, EulerScene.XLINE_MATERIAL);
    this.xLineHum.name = 'xLineHum';
    this.xLineHum.renderOrder = 4;
    this.xLineHum.rotateY(Math.PI/2);
    this.axialPlaneHum.add(this.xLineHum);


    //this is the axial group that only moves with the humeral axis (i.e. no axial rotation)
    const xLine_noAxial = new Mesh(this.THIN_LINE_GEOMETRY, EulerScene.XLINE_MATERIAL_BLACK);
    xLine_noAxial.renderOrder = 4;
    xLine_noAxial.rotateY(Math.PI/2);

    this.noAxialGroup = new Group();
    this.noAxialGroup.add(xLine_noAxial);
    this.scene.add(this.noAxialGroup);

    this.realAxialRotation = this.rotations[0].axis.y * this.rotations[0].angle;

    this.updateAxialRotationStep();
    this.updateAxialRotationFrame(0);
}

export function updateAxialRotationFrame_shortestPath(frameNum) {
    this.xLine.getWorldPosition(this.noAxialGroup.position);
    this.xLine.getWorldQuaternion(this.noAxialGroup.quaternion);
    this.noAxialGroup.rotateY(-Math.PI / 2);

    const currentFrame = Math.floor(frameNum);
    if (currentFrame >= this.steps[this.currentStep].numFrames) {
        this.noAxialGroup.rotateY(-this.realAxialRotation);
    } else {
        const interpFactor = frameNum / this.steps[this.currentStep].numFrames;
        this.noAxialGroup.rotateY(-this.realAxialRotation * interpFactor);
    }
}

export function updateAxialRotationFrame_swingTwist() {
    const currentHumeralAxis = this.steps[this.currentStep].triad.arrowAxis(1);
    this.noAxialGroup.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), currentHumeralAxis);
    this.noAxialGroup.position.copy(new Vector3().copy(currentHumeralAxis).multiplyScalar(-this.humerusLength));
}

export function updateAxialRotationFrame_euler() {
    if (this.currentStep < 2) {
        updateZeroAxialLine_Euler(this);
    }
}

export function updateAxialRotationStep_swingTwist() {
    this.stepBones[this.currentStep].add(this.axialPlane);
    this.stepBones[this.currentStep].getObjectByName('xLine').visible = (this.currentStep > 0);
    this.updateAxialRotationFrame(0);
}

export function updateAxialRotationStep_simultaneous() {
    this.stepBones[this.currentStep].add(this.axialPlane);
    this.stepBones[this.currentStep].getObjectByName('xLine').visible = true;
    this.updateAxialRotationFrame(0);
}

export function updateAxialRotationStep_svd() {
    this.stepBones[this.currentStep].add(this.axialPlane);
    this.stepBones[this.currentStep].getObjectByName('xLine').visible = (this.currentStep > 1);
    this.updateAxialRotationFrame(0);
}

export function updateAxialRotationStep_euler() {
    this.stepBones[this.currentStep].add(this.axialPlane);
    this.stepBones[this.currentStep].getObjectByName('xLine').visible = (this.currentStep > 1);
    updateZeroAxialLine_Euler(this);
}

export function updateAxialRotationStep_shortestPath() {
    this.stepBones[this.currentStep].add(this.axialPlane);
    this.stepBones[this.currentStep].getObjectByName('xLine').visible = true;
    this.updateAxialRotationFrame(0);
}

function updateZeroAxialLine_Euler(scene) {
    const currentHumeralAxis = scene.steps[scene.currentStep].triad.arrowAxis(1);
    scene.noAxialGroup.setRotationFromQuaternion(scene.steps[scene.currentStep].triad.quaternion);
    scene.noAxialGroup.position.copy(new Vector3().copy(currentHumeralAxis).multiplyScalar(-scene.humerusLength));
}

export function enableAxialRot(boneScene, updateFnc) {
    boneScene.PLANE_GEOMETRY = new CircleBufferGeometry(boneScene.triadLength, 16);
    boneScene.PLANE_GEOMETRY.rotateX(-Math.PI/2);
    boneScene.THIN_LINE_GEOMETRY = new PlaneBufferGeometry(boneScene.triadLength*boneScene.triadAspectRatio*0.75, boneScene.triadLength, 1, 5);
    boneScene.THIN_LINE_GEOMETRY.rotateX(-Math.PI/2);
    boneScene.THIN_LINE_GEOMETRY.translate(0, 0, boneScene.triadLength/2);

    boneScene.updateAxialRotationStep = updateFnc.step_update;
    boneScene.updateAxialRotationFrame = updateFnc.frame_update;

    boneScene.addEventListener('init', function (event) {
        const scene = event.target;
        initAxialRotation.call(scene)
    });

    boneScene.addEventListener('removeSteps', function (event) {
        const scene = event.target;
        scene.scene.remove(scene.noAxialGroup);
    });

    boneScene.addEventListener('stepChange', function (event) {
        const scene = event.target;
        scene.updateAxialRotationStep();
    });

    boneScene.addEventListener('frameChange', function (event) {
        const scene = event.target;
        scene.steps[scene.currentStep].triad.updateMatrixWorld();
        scene.updateAxialRotationFrame(event.frameNum);
    });

    boneScene.addEventListener('reset', function (event) {
        const scene = event.target;
        initAxialRotation.call(scene);
    });

    boneScene.addEventListener('dispose', function (event) {
        const scene = event.target;
        disposeAxial(scene);
    });
}

function disposeAxial(boneScene) {
    boneScene.PLANE_GEOMETRY.dispose();
    boneScene.THIN_LINE_GEOMETRY.dispose();
}
