import * as THREE from "./vendor/three.js/build/three.module.js";
import {EulerBoneScene} from "./EulerBoneScene.js";

export function attachAxialPlanesToHumeri_axial() {
    this.stepHumeri.forEach(humerus => {
        //this is the axial plane that simply goes along with the the humerus
        const axialPlane = new THREE.Mesh(this.PLANE_GEOMETRY, EulerBoneScene.AXIAL_PLANE_MATERIAL);
        axialPlane.renderOrder = 2;
        axialPlane.position.set(0, 0, 0);
        axialPlane.translateY(-this.humerusLength);
        humerus.add(axialPlane);

        const xLine = new THREE.Mesh(this.THIN_LINE_GEOMETRY, EulerBoneScene.XLINE_MATERIAL);
        xLine.renderOrder = 3;
        xLine.rotateY(Math.PI/2);
        axialPlane.add(xLine);
    });

    //this is the axial group that only moves with the humeral axis (i.e. no axial rotation)
    const xLine_noAxial = new THREE.Mesh(this.THIN_LINE_GEOMETRY, EulerBoneScene.XLINE_MATERIAL_WIRE);
    xLine_noAxial.renderOrder = 3;
    xLine_noAxial.rotateY(Math.PI/2);

    this.noAxialGroup = new THREE.Group();
    this.noAxialGroup.add(xLine_noAxial);
    this.scene.add(this.noAxialGroup);
    this.updateNoAxialRotationGroup();
};

export function updateNoAxialRotationGroup_axial() {
    this.steps[this.currentStep-1].triad.updateMatrixWorld();
    const currentHumeralAxis = this.steps[this.currentStep-1].triad.arrowAxis(1);
    this.noAxialGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), currentHumeralAxis);
    this.noAxialGroup.position.copy(new THREE.Vector3().copy(currentHumeralAxis).multiplyScalar(-this.humerusLength));
};