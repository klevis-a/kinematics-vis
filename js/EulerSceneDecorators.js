import * as THREE from "./vendor/three.js/build/three.module.js";
import * as EulerGeometry from "./EulerGeometry.js";
import {EulerBoneScene} from "./EulerBoneScene.js";
import {EulerScene} from "./EulerScene.js";

EulerScene.prototype.update_euler_angles = function() {
    this.finalTriad_angles.quaternion.copy(this.quaternions[this.quaternions.length-1]);
    this.finalTriad_angles.updateMatrixWorld();
    this.poe_angles.children.forEach(child => child.geometry.dispose());
    this.ea_angles.children.forEach(child => child.geometry.dispose());
    this.scene.remove(this.poe_angles);
    this.scene.remove(this.ea_angles);

    this.add_euler_angles();
};

EulerScene.prototype.prepare_scene_for_euler_angles = function() {
    const recursiveSet = child => child.layers.set(this.eulerAnglesLayer);
    const recursiveEnable = child => child.layers.enable(this.eulerAnglesLayer);

    const sceneObjects = [this.humerus, this.spotlight, this.xyPlane, this.xzPlane, this.yzPlane, this.xAxis, this.yAxis, this.zAxis];
    sceneObjects.forEach(sceneObject => sceneObject.layers.enable(this.eulerAnglesLayer));
    this.sphere.traverse(recursiveEnable);

    this.initTriad_angles = new EulerGeometry.Triad(this.triadLength, this.triadAspectRatio, 1, 0, this.markingsStart, this.arcStripWidth*3);
    this.scene.add(this.initTriad_angles);
    this.initHumerus_angles = new THREE.Mesh(this.humerusGeometry, EulerBoneScene.BONE_MATERIAL);
    this.initTriad_angles.add(this.initHumerus_angles);
    this.initTriad_angles.layers.set(this.eulerAnglesLayer);

    this.finalTriad_angles = new EulerGeometry.Triad(this.triadLength, this.triadAspectRatio, 4, 3, this.markingsStart, this.arcStripWidth*3);
    this.scene.add(this.finalTriad_angles);
    this.finalHumerus_angles = new THREE.Mesh(this.humerusGeometry, EulerBoneScene.BONE_MATERIAL);
    this.finalTriad_angles.add(this.finalHumerus_angles);
    this.finalTriad_angles.layers.set(this.eulerAnglesLayer);

    const angleObjects = [this.initTriad_angles, this.finalTriad_angles];
    angleObjects.forEach(complexObject => complexObject.traverse(recursiveSet));

    this.finalTriad_angles.quaternion.copy(this.quaternions[this.quaternions.length-1]);
    this.finalTriad_angles.updateMatrixWorld();

    this.add_euler_angles();
};

EulerScene.prototype.add_euler_angles = function() {
    const [poe_object, ea_object] = this.eulerAnglesFnc(this.finalTriad_angles, this.humerusLength, this.eulerAnglesLayer);
    this.poe_angles = poe_object;
    this.ea_angles = ea_object;
    this.scene.add(this.poe_angles);
    this.scene.add(this.ea_angles);
};

EulerScene.prototype.addSphere = function() {
    const sphereGeometry = new THREE.SphereBufferGeometry(this.humerusLength, this.numLongitudeSegments, this.numLatitudeSegments, 0, Math.PI, 0, Math.PI);
    const sphereGeometryEdges = new THREE.EdgesGeometry(sphereGeometry);
    const edgesMaterial = new THREE.LineBasicMaterial({color: 0x000000});
    this.sphere = new THREE.LineSegments(sphereGeometryEdges, edgesMaterial);
    this.scene.add(this.sphere);

    const longitudeDeltaAngle = Math.PI/this.numLongitudeSegments;
    for (let i=1; i<this.numLongitudeSegments; i++) {
        const points = [];
        points.push(new THREE.Vector3());
        points.push(new THREE.Vector3(Math.cos(i*longitudeDeltaAngle)*this.humerusLength, 0, Math.sin(i*longitudeDeltaAngle)*this.humerusLength));
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(lineGeometry, edgesMaterial);
        this.sphere.add(line);
    }
};

EulerScene.prototype.changeSphere = function(northPole) {
    this.sphere.setRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), northPole));
};