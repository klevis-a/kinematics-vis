import * as THREE from "./vendor/three.js/build/three.module.js";
import {EulerScene} from "./EulerScene.js";

EulerScene.AXIAL_PLANE_MATERIAL = new THREE.MeshBasicMaterial({color: 0xffffff, side: THREE.DoubleSide, depthTest: false});
EulerScene.XLINE_MATERIAL = new THREE.MeshBasicMaterial({color: 0xff0000, side: THREE.DoubleSide, depthTest: false});
EulerScene.XLINE_MATERIAL_WIRE = new THREE.MeshBasicMaterial({color: 0xff0000, side: THREE.DoubleSide, depthTest: false, wireframe: true});

export const AXIAL_ROT_METHODS = {
    EULER: {
        step_update: updateAxialRotationStep_euler,
        frame_update: updateAxialRotationFrame_euler
    },

    TWO_STEP: {
        step_update: updateAxialRotationStep_axial,
        frame_update: updateAxialRotationFrame_axial
    },

    ONE_STEP: {
        step_update: updateAxialRotationStep_oneStep,
        frame_update: updateAxialRotationFrame_oneStep
    },

    SVD: {
        step_update: updateAxialRotationStep_svd,
        frame_update: updateAxialRotationFrame_axial
    },

    SIMULTANEOUS: {
        step_update: updateAxialRotationStep_simultaneous,
        frame_update: updateAxialRotationFrame_axial
    }
};

export function initAxialRotation() {
    //this is the axial plane that simply goes along with the the humerus
    this.axialPlane = new THREE.Mesh(this.PLANE_GEOMETRY, EulerScene.AXIAL_PLANE_MATERIAL);
    this.axialPlane.name = 'axialPlane';
    this.axialPlane.renderOrder = 2;
    this.axialPlane.position.set(0, 0, 0);
    this.axialPlane.translateY(-this.humerusLength);
    this.stepHumeri[0].add(this.axialPlane);

    this.xLine = new THREE.Mesh(this.THIN_LINE_GEOMETRY, EulerScene.XLINE_MATERIAL);
    this.xLine.name = 'xLine';
    this.xLine.visible = false;
    this.xLine.renderOrder = 3;
    this.xLine.rotateY(Math.PI/2);
    this.axialPlane.add(this.xLine);


    //this is the axial group that only moves with the humeral axis (i.e. no axial rotation)
    const xLine_noAxial = new THREE.Mesh(this.THIN_LINE_GEOMETRY, EulerScene.XLINE_MATERIAL_WIRE);
    xLine_noAxial.renderOrder = 3;
    xLine_noAxial.rotateY(Math.PI/2);

    this.noAxialGroup = new THREE.Group();
    this.noAxialGroup.add(xLine_noAxial);
    this.scene.add(this.noAxialGroup);

    this.realAxialRotation = this.rotations[0].axis.y * this.rotations[0].angle;

    this.updateAxialRotationStep();
    this.updateAxialRotationFrame(0);
}

export function updateAxialRotationFrame_oneStep(frameNum) {
    this.steps[this.currentStep].triad.updateMatrixWorld();
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

export function updateAxialRotationFrame_axial() {
    this.steps[this.currentStep].triad.updateMatrixWorld();
    const currentHumeralAxis = this.steps[this.currentStep].triad.arrowAxis(1);
    this.noAxialGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), currentHumeralAxis);
    this.noAxialGroup.position.copy(new THREE.Vector3().copy(currentHumeralAxis).multiplyScalar(-this.humerusLength));
}

export function updateAxialRotationFrame_euler() {
    if (this.currentStep < 2) {
        updateZeroAxialLine_Euler(this);
    }
}

export function updateAxialRotationStep_axial() {
    this.stepHumeri[this.currentStep].add(this.axialPlane);
    this.stepHumeri[this.currentStep].getObjectByName('xLine').visible = (this.currentStep > 0);
    this.updateAxialRotationFrame(0);
}

export function updateAxialRotationStep_simultaneous() {
    this.stepHumeri[this.currentStep].add(this.axialPlane);
    this.stepHumeri[this.currentStep].getObjectByName('xLine').visible = true;
    this.updateAxialRotationFrame(0);
}

export function updateAxialRotationStep_svd() {
    this.stepHumeri[this.currentStep].add(this.axialPlane);
    this.stepHumeri[this.currentStep].getObjectByName('xLine').visible = (this.currentStep > 1);
    this.updateAxialRotationFrame(0);
}

export function updateAxialRotationStep_euler() {
    this.stepHumeri[this.currentStep].add(this.axialPlane);
    this.stepHumeri[this.currentStep].getObjectByName('xLine').visible = (this.currentStep > 1);
    updateZeroAxialLine_Euler(this);
}

export function updateAxialRotationStep_oneStep() {
    this.stepHumeri[this.currentStep].add(this.axialPlane);
    this.stepHumeri[this.currentStep].getObjectByName('xLine').visible = true;
    this.updateAxialRotationFrame(0);
}

function updateZeroAxialLine_Euler(scene) {
    scene.steps[scene.currentStep].triad.updateMatrixWorld();
    const currentHumeralAxis = scene.steps[scene.currentStep].triad.arrowAxis(1);
    scene.noAxialGroup.setRotationFromQuaternion(scene.steps[scene.currentStep].triad.quaternion);
    scene.noAxialGroup.position.copy(new THREE.Vector3().copy(currentHumeralAxis).multiplyScalar(-scene.humerusLength));
}

export function enableAxialRot(boneScene, updateFnc) {
    boneScene.PLANE_GEOMETRY = new THREE.CircleBufferGeometry(boneScene.triadLength, 16);
    boneScene.PLANE_GEOMETRY.rotateX(-Math.PI/2);
    boneScene.THIN_LINE_GEOMETRY = new THREE.PlaneBufferGeometry(boneScene.triadLength*boneScene.triadAspectRatio*0.5, boneScene.triadLength, 1, 5);
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
        scene.updateAxialRotationFrame(event.frameNum);
    });

    boneScene.addEventListener('reset', function (event) {
        const scene = event.target;
        initAxialRotation.call(scene);
    });
}
