import * as THREE from "./vendor/three.js/build/three.module.js";
import * as EulerGeometry from "./EulerGeometry.js";
import {EulerScene} from "./EulerScene.js";

EulerScene.prototype.update_angles_vis = function() {
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
    this.initTriad_angles = new EulerGeometry.Triad(this.triadLength, this.triadAspectRatio, 1, 0, this.markingsStart, this.arcStripWidth*3);
    this.scene.add(this.initTriad_angles);
    this.initHumerus_angles = new THREE.Mesh(this.boneGeometry, EulerScene.BONE_MATERIAL);
    this.initTriad_angles.add(this.initHumerus_angles);
    this.initTriad_angles.layers.set(this.anglesVisLayer);

    // add a final humerus
    this.finalTriad_angles = new EulerGeometry.Triad(this.triadLength, this.triadAspectRatio, 4, 3, this.markingsStart, this.arcStripWidth*3);
    this.scene.add(this.finalTriad_angles);
    this.finalHumerus_angles = new THREE.Mesh(this.boneGeometry, EulerScene.BONE_MATERIAL);
    this.finalTriad_angles.add(this.finalHumerus_angles);
    this.finalTriad_angles.layers.set(this.anglesVisLayer);

    const angleObjects = [this.initTriad_angles, this.finalTriad_angles];
    angleObjects.forEach(complexObject => complexObject.traverse(recursiveSet));

    this.finalTriad_angles.quaternion.copy(this.quaternions[this.quaternions.length-1]);
    this.finalTriad_angles.updateMatrixWorld();

    this.add_angles_vis();
};

EulerScene.prototype.add_angles_vis = function() {
    const recursiveSet = child => child.layers.set(this.anglesVisLayer);
    this.anglesVis = this.anglesVisFnc(this);
    this.anglesVis.forEach(anglesVis => {
        this.scene.add(anglesVis);
        anglesVis.traverse(recursiveSet);
    })
};

export function enableAngleVis(boneScene, visLayer, visFunc) {
    boneScene.anglesVisLayer = visLayer;
    boneScene.anglesVisFnc = visFunc;
    boneScene.addEventListener('init', function (event) {
        const scene = event.target;
        scene.prepare_scene_for_angle_vis();
    });
    boneScene.addEventListener('reset', function (event) {
        const scene = event.target;
        scene.update_angles_vis();
    });
}
