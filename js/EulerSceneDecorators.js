import * as THREE from "./vendor/three.js/build/three.module.js";
import * as EulerGeometry from "./EulerGeometry.js";
import {EulerBoneScene} from "./EulerBoneScene.js";

export function addEulerAngles(eulerScene, layerId) {
    const sceneObjects = [eulerScene.spotlight, eulerScene.xyPlane, eulerScene.xzPlane, eulerScene.yzPlane, eulerScene.xAxis, eulerScene.yAxis, eulerScene.zAxis];
    sceneObjects.forEach(sceneObject => sceneObject.layers.enable(layerId));

    eulerScene.initTriad_angles = new EulerGeometry.Triad(eulerScene.triadLength, eulerScene.triadAspectRatio, 1, 0, eulerScene.markingsStart, eulerScene.arcStripWidth*3);
    eulerScene.scene.add(eulerScene.initTriad_angles);
    eulerScene.initHumerus_angles = new THREE.Mesh(eulerScene.humerusGeometry, EulerBoneScene.BONE_MATERIAL);
    eulerScene.initTriad_angles.add(eulerScene.initHumerus_angles);
    eulerScene.initTriad_angles.layers.set(layerId);

    eulerScene.finalTriad_angles = new EulerGeometry.Triad(eulerScene.triadLength, eulerScene.triadAspectRatio, 4, 3, eulerScene.markingsStart, eulerScene.arcStripWidth*3);
    eulerScene.finalTriad_angles.quaternion.copy(eulerScene.quaternions[eulerScene.quaternions.length-1]);
    eulerScene.scene.add(eulerScene.finalTriad_angles);
    eulerScene.finalHumerus_angles = new THREE.Mesh(eulerScene.humerusGeometry, EulerBoneScene.BONE_MATERIAL);
    eulerScene.finalTriad_angles.add(eulerScene.finalHumerus_angles);
    eulerScene.finalTriad_angles.layers.set(layerId);

    const complexObjects = [eulerScene.initTriad_angles, eulerScene.finalTriad_angles];
    const recursiveSet = child => child.layers.set(layerId);
    complexObjects.forEach(complexObject => complexObject.traverse(recursiveSet));
}