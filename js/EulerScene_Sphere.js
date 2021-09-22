'use strict';

import {EulerScene} from "./EulerScene.js";
import {SphereBufferGeometry, EdgesGeometry, LineBasicMaterial, LineSegments, Vector3, Plane,
    CircleBufferGeometry, Quaternion} from "three";

EulerScene.prototype.addSphere = function(northPole) {
    this.northPole = northPole;
    const sphereGeometry = new SphereBufferGeometry(this.humerusLength, this.numLongitudeSegments, this.numLatitudeSegments, 0, Math.PI, 0, Math.PI);
    const sphereGeometryEdges = new EdgesGeometry(sphereGeometry);
    this.sphereEdgesMaterial = new LineBasicMaterial({color: 0x000000});
    this.finalLatLongMaterial = new LineBasicMaterial({color: 0xffff00});
    this.sphere = new LineSegments(sphereGeometryEdges, this.sphereEdgesMaterial);
    this.scene.add(this.sphere);

    // the lines below are drawn at the equator - they can be useful but also add visual comlexity so I am removing them for now
    // const longitudeDeltaAngle = Math.PI/this.numLongitudeSegments;
    // for (let i=1; i<this.numLongitudeSegments; i++) {
    //     const points = [];
    //     points.push(new Vector3());
    //     points.push(new Vector3(Math.cos(i*longitudeDeltaAngle)*this.humerusLength, 0, Math.sin(i*longitudeDeltaAngle)*this.humerusLength));
    //     const lineGeometry = new BufferGeometry().setFromPoints(points);
    //     const line = new Line(lineGeometry, this.sphereEdgesMaterial);
    //     this.sphere.add(line);
    // }
};

EulerScene.prototype.changeSphere = function(northPole) {
    this.northPole = northPole;
    this.sphere.setRotationFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), this.northPole));
    this.addFinalLatitudeLongitude();
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
    const finalTriad = this.steps[this.steps.length-1].endingTriad;
    finalTriad.updateMatrixWorld(true);
    const humeral_axis = finalTriad.arrowAxis(1).multiplyScalar(-1*this.humerusLength);
    const plane = new Plane(this.northPole);
    const projectedHumeralAxis = new Vector3();
    plane.projectPoint(humeral_axis, projectedHumeralAxis);
    const longitudePerpendicular = new Vector3().crossVectors(humeral_axis, projectedHumeralAxis).normalize();
    const circleNormal = new Vector3(0, 0, 1);

    const longitudeGeometry = new CircleBufferGeometry(this.humerusLength, 60);
    const longitudeEdgesGeometry = new EdgesGeometry(longitudeGeometry);
    this.finalLongitude = new LineSegments(longitudeEdgesGeometry, this.finalLatLongMaterial);
    this.finalLongitude.renderOrder = 3;
    this.finalLongitude.setRotationFromQuaternion(new Quaternion().setFromUnitVectors(circleNormal, longitudePerpendicular));
    this.scene.add(this.finalLongitude);

    const latitudeGeometry = new CircleBufferGeometry(projectedHumeralAxis.length(), 60);
    const latitudeEdgesGeometry = new EdgesGeometry(latitudeGeometry);
    this.finalLatitude = new LineSegments(latitudeEdgesGeometry, this.finalLatLongMaterial);
    this.finalLatitude.renderOrder = 3;
    this.finalLatitude.setRotationFromQuaternion(new Quaternion().setFromUnitVectors(circleNormal, this.northPole));
    this.finalLatitude.position.copy(new Vector3().subVectors(humeral_axis, projectedHumeralAxis));
    this.scene.add(this.finalLatitude);
};

EulerScene.prototype.toggleSphereVisibility = function (flag) {
    this.sphere.visible = flag;
    this.finalLongitude.visible = flag;
    this.finalLatitude.visible = flag;
};

export function enableSphere(boneScene) {
    boneScene.numLatitudeSegments = 20;
    boneScene.numLongitudeSegments = 10;
    boneScene.addEventListener('init', function (event) {
        const scene = event.target;
        scene.addSphere(new Vector3(0, 1, 0));
        scene.addFinalLatitudeLongitude();
    });
    boneScene.addEventListener('reset', function (event) {
        const scene = event.target;
        scene.addFinalLatitudeLongitude();
        scene.toggleSphereVisibility(scene.sphere.visible);
    });
    boneScene.addEventListener('dispose', function (event) {
        const scene = event.target;
        disposeSphere(scene);
    });
}

function disposeSphere(boneScene) {
    boneScene.sphere.geometry.dispose();
    boneScene.sphereEdgesMaterial.dispose();
    boneScene.finalLatLongMaterial.dispose();
    boneScene.finalLongitude.geometry.dispose();
    boneScene.finalLatitude.geometry.dispose();
}
