import {EulerScene} from "./EulerScene.js";
import * as THREE from "./vendor/three.js/build/three.module.js";

EulerScene.prototype.addSphere = function(northPole) {
    this.northPole = northPole;
    const sphereGeometry = new THREE.SphereBufferGeometry(this.humerusLength, this.numLongitudeSegments, this.numLatitudeSegments, 0, Math.PI, 0, Math.PI);
    const sphereGeometryEdges = new THREE.EdgesGeometry(sphereGeometry);
    this.sphereEdgesMaterial = new THREE.LineBasicMaterial({color: 0x000000});
    this.finalLatLongMaterial = new THREE.LineBasicMaterial({color: 0xffff00});
    this.sphere = new THREE.LineSegments(sphereGeometryEdges, this.sphereEdgesMaterial);
    this.scene.add(this.sphere);

    const longitudeDeltaAngle = Math.PI/this.numLongitudeSegments;
    for (let i=1; i<this.numLongitudeSegments; i++) {
        const points = [];
        points.push(new THREE.Vector3());
        points.push(new THREE.Vector3(Math.cos(i*longitudeDeltaAngle)*this.humerusLength, 0, Math.sin(i*longitudeDeltaAngle)*this.humerusLength));
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(lineGeometry, this.sphereEdgesMaterial);
        this.sphere.add(line);
    }
};

EulerScene.prototype.changeSphere = function(northPole) {
    this.northPole = northPole;
    this.sphere.setRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), this.northPole));
};

EulerScene.prototype.addFinalLatitudeLongitude = function () {
    if (this.finalLongitude) {
        this.finalLongitude.geometry.dispose();
        this.scene.remove(this.finalLongitude);
    }
    if (this.finalLatitude) {
        this.finalLatitude.geometry.dispose();
        this.scene.remove(this.finalLatitude);
    }
    const finalTriad = this.steps[this.steps.length-1].triad;
    finalTriad.updateMatrixWorld(true);
    const humeral_axis = finalTriad.arrowAxis(1).multiplyScalar(-1*this.humerusLength);
    const plane = new THREE.Plane(this.northPole);
    const projectedHumeralAxis = new THREE.Vector3();
    plane.projectPoint(humeral_axis, projectedHumeralAxis);
    const longitudePerpendicular = new THREE.Vector3().crossVectors(humeral_axis, projectedHumeralAxis).normalize();
    const circleNormal = new THREE.Vector3(0, 0, 1);

    const longitudeGeometry = new THREE.CircleBufferGeometry(this.humerusLength, 60);
    const longitudeEdgesGeometry = new THREE.EdgesGeometry(longitudeGeometry);
    this.finalLongitude = new THREE.LineSegments(longitudeEdgesGeometry, this.finalLatLongMaterial);
    this.finalLongitude.renderOrder = 4;
    this.finalLongitude.setRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(circleNormal, longitudePerpendicular));
    this.scene.add(this.finalLongitude);

    const latitudeGeometry = new THREE.CircleBufferGeometry(projectedHumeralAxis.length(), 60);
    const latitudeEdgesGeometry = new THREE.EdgesGeometry(latitudeGeometry);
    this.finalLatitude = new THREE.LineSegments(latitudeEdgesGeometry, this.finalLatLongMaterial);
    this.finalLatitude.renderOrder = 4;
    this.finalLatitude.setRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(circleNormal, this.northPole));
    this.finalLatitude.position.copy(new THREE.Vector3().subVectors(humeral_axis, projectedHumeralAxis));
    this.scene.add(this.finalLatitude);
};

export function enableSphere(boneScene) {
    boneScene.numLatitudeSegments = 20;
    boneScene.numLongitudeSegments = 10;
    boneScene.addEventListener('init', function (event) {
        const scene = event.target;
        scene.addSphere(new THREE.Vector3(0, 1, 0));
        scene.addFinalLatitudeLongitude();
    });
    boneScene.addEventListener('reset', function (event) {
        const scene = event.target;
        scene.addFinalLatitudeLongitude();
    });
}

