import * as THREE from "./vendor/three.js/build/three.module.js";
import {EulerBoneScene} from "./EulerBoneScene.js";

export function initAxialRotation() {
    //this is the axial plane that simply goes along with the the humerus
    this.axialPlane = new THREE.Mesh(this.PLANE_GEOMETRY, EulerBoneScene.AXIAL_PLANE_MATERIAL);
    this.axialPlane.name = 'axialPlane';
    this.axialPlane.renderOrder = 2;
    this.axialPlane.position.set(0, 0, 0);
    this.axialPlane.translateY(-this.humerusLength);
    this.stepHumeri[0].add(this.axialPlane);

    this.xLine = new THREE.Mesh(this.THIN_LINE_GEOMETRY, EulerBoneScene.XLINE_MATERIAL);
    this.xLine.name = 'xLine';
    this.xLine.visible = false;
    this.xLine.renderOrder = 3;
    this.xLine.rotateY(Math.PI/2);
    this.axialPlane.add(this.xLine);


    //this is the axial group that only moves with the humeral axis (i.e. no axial rotation)
    const xLine_noAxial = new THREE.Mesh(this.THIN_LINE_GEOMETRY, EulerBoneScene.XLINE_MATERIAL_WIRE);
    xLine_noAxial.renderOrder = 3;
    xLine_noAxial.rotateY(Math.PI/2);

    this.noAxialGroup = new THREE.Group();
    this.noAxialGroup.add(xLine_noAxial);
    this.scene.add(this.noAxialGroup);

    this.realAxialRotation = this.rotations[0].axis.y * this.rotations[0].angle;

    this.updateAxialRotationStep();
    this.updateAxialRotationFrame();
}

export function updateAxialRotationFrame_oneStep(frameNum) {
    if (this.currentStep === 1) {
        this.steps[this.currentStep - 1].triad.updateMatrixWorld();
        this.xLine.getWorldPosition(this.noAxialGroup.position);
        this.xLine.getWorldQuaternion(this.noAxialGroup.quaternion);
        this.noAxialGroup.rotateY(-Math.PI / 2);

        const currentFrame = Math.floor(frameNum);
        if (currentFrame >= this.steps[this.currentStep - 1].numFrames) {
            this.noAxialGroup.rotateY(-this.realAxialRotation);
        } else {
            const interpFactor = frameNum / this.steps[this.currentStep - 1].numFrames;
            this.noAxialGroup.rotateY(-this.realAxialRotation * interpFactor);
        }
    }
}

export function updateAxialRotationFrame_axial() {
    this.steps[this.currentStep-1].triad.updateMatrixWorld();
    const currentHumeralAxis = this.steps[this.currentStep-1].triad.arrowAxis(1);
    this.noAxialGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), currentHumeralAxis);
    this.noAxialGroup.position.copy(new THREE.Vector3().copy(currentHumeralAxis).multiplyScalar(-this.humerusLength));
}

export function updateAxialRotationFrame_euler() {
    if (this.currentStep < 3) {
        this.steps[this.currentStep-1].triad.updateMatrixWorld();
        const currentHumeralAxis = this.steps[this.currentStep-1].triad.arrowAxis(1);
        this.noAxialGroup.setRotationFromQuaternion(this.steps[this.currentStep-1].triad.quaternion);
        this.noAxialGroup.position.copy(new THREE.Vector3().copy(currentHumeralAxis).multiplyScalar(-this.humerusLength));
    }
}

export function updateAxialRotationStep_axial() {
    this.stepHumeri[this.currentStep - 1].add(this.axialPlane);
    this.stepHumeri[this.currentStep - 1].getObjectByName('xLine').visible = (this.currentStep > 1);
    this.updateAxialRotationFrame(0);
}

export function updateAxialRotationStep_svd() {
    this.stepHumeri[this.currentStep-1].add(this.axialPlane);
    this.stepHumeri[this.currentStep-1].getObjectByName('xLine').visible = (this.currentStep > 2);
    this.updateAxialRotationFrame(0);
}

export function updateAxialRotationStep_euler() {
    this.stepHumeri[this.currentStep-1].add(this.axialPlane);
    this.stepHumeri[this.currentStep-1].getObjectByName('xLine').visible = (this.currentStep > 2);
    this.updateAxialRotationFrame(0);
}

export function updateAxialRotationStep_oneStep() {
    this.stepHumeri[this.currentStep-1].add(this.axialPlane);
    this.stepHumeri[this.currentStep-1].getObjectByName('xLine').visible = true;
    this.updateAxialRotationFrame(0);
}