import * as THREE from "./vendor/three.js/build/three.module.js";
import * as EulerGeometry from "./EulerGeometry.js";
import {EulerBoneScene} from "./EulerBoneScene.js";
import {EulerScene} from "./EulerScene.js";
import {Euler_yxy_angle_geometry} from "./EulerAnglesGeometry.js";

EulerScene.prototype.update_yxy_euler_angles = function() {
    this.finalTriad_angles_yxy.quaternion.copy(this.quaternions[this.quaternions.length-1]);
    this.finalTriad_angles_yxy.updateMatrixWorld();
    this.poe_angles_yxy.children.forEach(child => child.geometry.dispose());
    this.ea_angles_yxy.children.forEach(child => child.geometry.dispose());
    this.scene.remove(this.poe_angles_yxy);
    this.scene.remove(this.ea_angles_yxy);
    const [poe_object, ea_object] = Euler_yxy_angle_geometry.createAngleObjects(this.finalTriad_angles_yxy.arrowAxis(1), this.humerusLength, this.yxy_layer_id);
    this.poe_angles_yxy = poe_object;
    this.ea_angles_yxy = ea_object;
    this.scene.add(this.poe_angles_yxy);
    this.scene.add(this.ea_angles_yxy);
};

EulerScene.prototype.add_yxy_euler_angles = function(layerId) {
    this.yxy_layer_id = layerId;

    const sceneObjects = [this.humerus, this.spotlight, this.xyPlane, this.xzPlane, this.yzPlane, this.xAxis, this.yAxis, this.zAxis];
    sceneObjects.forEach(sceneObject => sceneObject.layers.enable(layerId));

    this.initTriad_angles_yxy = new EulerGeometry.Triad(this.triadLength, this.triadAspectRatio, 1, 0, this.markingsStart, this.arcStripWidth*3);
    this.scene.add(this.initTriad_angles_yxy);
    this.initHumerus_angles_yxy = new THREE.Mesh(this.humerusGeometry, EulerBoneScene.BONE_MATERIAL);
    this.initTriad_angles_yxy.add(this.initHumerus_angles_yxy);
    this.initTriad_angles_yxy.layers.set(layerId);

    this.finalTriad_angles_yxy = new EulerGeometry.Triad(this.triadLength, this.triadAspectRatio, 4, 3, this.markingsStart, this.arcStripWidth*3);
    this.scene.add(this.finalTriad_angles_yxy);
    this.finalHumerus_angles_yxy = new THREE.Mesh(this.humerusGeometry, EulerBoneScene.BONE_MATERIAL);
    this.finalTriad_angles_yxy.add(this.finalHumerus_angles_yxy);
    this.finalTriad_angles_yxy.layers.set(layerId);

    const complexObjects = [this.initTriad_angles_yxy, this.finalTriad_angles_yxy];
    const recursiveSet = child => child.layers.set(layerId);
    complexObjects.forEach(complexObject => complexObject.traverse(recursiveSet));

    this.finalTriad_angles_yxy.quaternion.copy(this.quaternions[this.quaternions.length-1]);
    this.finalTriad_angles_yxy.updateMatrixWorld();

    const [poe_object, ea_object] = Euler_yxy_angle_geometry.createAngleObjects(this.finalTriad_angles_yxy.arrowAxis(1), this.humerusLength, this.yxy_layer_id);
    this.poe_angles_yxy = poe_object;
    this.ea_angles_yxy = ea_object;
    this.scene.add(this.poe_angles_yxy);
    this.scene.add(this.ea_angles_yxy);
};