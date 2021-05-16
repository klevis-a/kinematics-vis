'use strict';

import {Mesh, Group, Vector3} from "./vendor/three.js/build/three.module.js";
import {Triad} from "./EulerGeometry.js";
import {EulerScene} from "./EulerScene.js";

export function updateAxialRotVis_Euler () {
    const humeralAxis = this.finalTriad_angles.arrowAxis(1);
    this.noAxialGroup_vis.setRotationFromQuaternion(this.quaternions[this.quaternions.length-2]);
    this.noAxialGroup_vis.position.copy(new Vector3().copy(humeralAxis).multiplyScalar(-this.humerusLength));
}

export function updateAxialRotVis_SwingTwist () {
    const humeralAxis = this.finalTriad_angles.arrowAxis(1);
    this.noAxialGroup_vis.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), humeralAxis);
    this.noAxialGroup_vis.position.copy(new Vector3().copy(humeralAxis).multiplyScalar(-this.humerusLength));
}

export function updateAxialRotVis_ShortestPath () {
    this.xLine_vis.getWorldPosition(this.noAxialGroup_vis.position);
    this.xLine_vis.getWorldQuaternion(this.noAxialGroup_vis.quaternion);
    this.noAxialGroup_vis.rotateY(-Math.PI / 2);
    this.noAxialGroup_vis.rotateY(-this.realAxialRotation);
}

EulerScene.prototype.update_angles_vis = function() {
    this.finalLongitude.layers.enable(this.anglesVisLayer);
    this.finalLatitude.layers.enable(this.anglesVisLayer);
    this.finalTriad_angles.quaternion.copy(this.quaternions[this.quaternions.length-1]);
    this.finalTriad_angles.updateMatrixWorld();
    const geometryDispose = child => child.geometry.dispose();
    this.anglesVis.forEach(anglesVis => {
        anglesVis.children.forEach(geometryDispose);
        this.scene.remove(anglesVis);
    });

    this.add_angles_vis();
};

EulerScene.prototype.prepare_scene_for_angle_vis = function() {
    const recursiveSet = child => child.layers.set(this.anglesVisLayer);
    const recursiveEnable = child => child.layers.enable(this.anglesVisLayer);

    // enable scene objects
    const sceneObjects = [this.bone, this.spotlight, this.xyPlane, this.xzPlane, this.yzPlane, this.xAxis, this.yAxis, this.zAxis];
    sceneObjects.forEach(sceneObject => sceneObject.layers.enable(this.anglesVisLayer));
    if (this.sphere) {
        this.sphere.traverse(recursiveEnable);
        this.finalLongitude.layers.enable(this.anglesVisLayer);
        this.finalLatitude.layers.enable(this.anglesVisLayer);
    }

    // add an initial humerus
    this.initTriad_angles = new Triad(this.triadLength, this.triadAspectRatio, 1, 0, this.markingsStart, this.arcStripWidth*3);
    this.scene.add(this.initTriad_angles);
    this.initHumerus_angles = new Mesh(this.boneGeometry, EulerScene.BONE_MATERIAL);
    this.initTriad_angles.add(this.initHumerus_angles);
    this.initTriad_angles.layers.set(this.anglesVisLayer);

    // add a final humerus
    this.finalTriad_angles = new Triad(this.triadLength, this.triadAspectRatio, 4, 3, this.markingsStart, this.arcStripWidth*3);
    this.scene.add(this.finalTriad_angles);
    this.finalHumerus_angles = new Mesh(this.boneGeometry, EulerScene.BONE_MATERIAL);
    this.finalTriad_angles.add(this.finalHumerus_angles);
    this.finalTriad_angles.layers.set(this.anglesVisLayer);

    const angleObjects = [this.initTriad_angles, this.finalTriad_angles];
    angleObjects.forEach(complexObject => complexObject.traverse(recursiveSet));

    this.finalTriad_angles.quaternion.copy(this.quaternions[this.quaternions.length-1]);
    this.finalTriad_angles.updateMatrixWorld();

    // if axial rotation is enable add axial rotation angles
    if (this.noAxialGroup) {
        const axialPlane = new Mesh(this.PLANE_GEOMETRY, EulerScene.AXIAL_PLANE_MATERIAL);
        axialPlane.renderOrder = 2;
        axialPlane.position.set(0, 0, 0);
        axialPlane.translateY(-this.humerusLength);
        axialPlane.layers.set(this.anglesVisLayer);
        this.finalTriad_angles.add(axialPlane);

        this.xLine_vis = new Mesh(this.THIN_LINE_GEOMETRY, EulerScene.XLINE_MATERIAL);
        this.xLine_vis.renderOrder = 4;
        this.xLine_vis.rotateY(Math.PI/2);
        this.xLine_vis.layers.set(this.anglesVisLayer);
        axialPlane.add(this.xLine_vis);

        //this is the axial group that only moves with the humeral axis (i.e. no axial rotation)
        const xLine_noAxial = new Mesh(this.THIN_LINE_GEOMETRY, EulerScene.XLINE_MATERIAL_BLACK);
        xLine_noAxial.renderOrder = 4;
        xLine_noAxial.rotateY(Math.PI/2);
        xLine_noAxial.layers.set(this.anglesVisLayer);

        this.noAxialGroup_vis = new Group();
        this.noAxialGroup_vis.layers.set(this.anglesVisLayer);
        this.noAxialGroup_vis.add(xLine_noAxial);
        this.scene.add(this.noAxialGroup_vis);
    }

    this.add_angles_vis();
};

EulerScene.prototype.add_angles_vis = function() {
    const recursiveSet = child => child.layers.set(this.anglesVisLayer);
    this.anglesVis = this.anglesVisFnc(this);
    this.anglesVis.forEach(anglesVis => {
        this.scene.add(anglesVis);
        anglesVis.traverse(recursiveSet);
    });

    if (this.noAxialGroup_vis) {
        this.updateAxialRotVis();
    }
};

export function enableAngleVis(boneScene, visLayer, visFunc, axialRotVisFnc) {
    boneScene.anglesVisLayer = visLayer;
    boneScene.anglesVisFnc = visFunc;
    boneScene.updateAxialRotVis = axialRotVisFnc;
    boneScene.addEventListener('init', function (event) {
        const scene = event.target;
        scene.prepare_scene_for_angle_vis();
    });
    boneScene.addEventListener('reset', function (event) {
        const scene = event.target;
        scene.update_angles_vis();
    });
    boneScene.addEventListener('dispose', function (event) {
        const scene = event.target;
        disposeAngleVis(scene);
    });
}

function disposeAngleVis(boneScene) {
    boneScene.initTriad_angles.dispose();
    boneScene.finalTriad_angles.dispose();
}
