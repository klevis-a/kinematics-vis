'use strict';

import * as THREE from "./vendor/three.js/build/three.module.js";

export class FatArrow extends THREE.Object3D {
    constructor(lineWidth, lineLength, coneRadius, coneHeight, color, wireframeColor=null) {
        super();
        this.lineWidth = lineWidth;
        this.lineLength = lineLength;
        this.coneRadius = coneRadius;
        this.coneHeight = coneHeight;

        this.arrowMaterial = new THREE.MeshPhongMaterial({color: color, opacity: 0.7, transparent: true});

        const lineGeometry = new THREE.CylinderBufferGeometry(this.lineWidth/2, this.lineWidth/2, this.lineLength, 10, 1);
        lineGeometry.translate(0, this.lineLength*0.5, 0);
        this.line = new THREE.Mesh(lineGeometry, this.arrowMaterial);
        this.add(this.line);

        const coneGeometry = new THREE.CylinderBufferGeometry(0, this.coneRadius, this.coneHeight, 20, 1);
        coneGeometry.translate(0, this.lineLength+0.5*this.coneHeight, 0);
        this.cone = new THREE.Mesh(coneGeometry, this.arrowMaterial);
        this.add(this.cone);

        if (wireframeColor !== null) {
            const lineEdges = new THREE.EdgesGeometry(lineGeometry);
            this.add(new THREE.LineSegments(lineEdges, new THREE.LineBasicMaterial({color: wireframeColor})));
            const coneEdges = new THREE.EdgesGeometry(coneGeometry);
            this.add(new THREE.LineSegments(coneEdges, new THREE.LineBasicMaterial({color: wireframeColor})));
        }
    }
}

export class Triad extends THREE.Object3D{
    static originMaterial = new THREE.MeshPhongMaterial({color: 0x000000});
    static reds = palette('cb-Reds',5);
    static greens = palette('cb-Greens',5);
    static blues = palette('cb-Blues',5);

    static intFromColor(col) {
        return parseInt('0x'+col);
    }

    constructor(length, aspectRatio=0.2, colorIntensity=4, wireframeColor) {
        super();
        this.length = length;
        this.aspectRatio = aspectRatio;
        this.colorIntensity = colorIntensity;

        const otherDims = this.aspectRatio*this.length;

        this.e1 = new FatArrow(otherDims, this.length, otherDims, otherDims, Triad.intFromColor(Triad.reds[this.colorIntensity]), wireframeColor);
        this.e2 = new FatArrow(otherDims, this.length, otherDims, otherDims, Triad.intFromColor(Triad.greens[this.colorIntensity]), wireframeColor);
        this.e3 = new FatArrow(otherDims, this.length, otherDims, otherDims, Triad.intFromColor(Triad.blues[this.colorIntensity]), wireframeColor);
        this.arrows = [this.e1, this.e2, this.e3];

        const originGeometry = new THREE.SphereBufferGeometry(otherDims/2, 10, 10);
        this.origin = new THREE.Mesh(originGeometry, Triad.originMaterial);

        this.e1.rotateZ(-Math.PI/2);
        this.e3.rotateX(Math.PI/2);

        this.add(this.e1);
        this.add(this.e2);
        this.add(this.e3);
        this.add(this.origin);
        this.updateMatrixWorld(true);
    }

    arrowAxis(dim) {
        return new THREE.Vector3().setFromMatrixColumn(this.arrows[dim].matrixWorld, 1);
    }


}

export function axisAngleFromQuat(quat) {
    quat.normalize();
    const angle = 2 * Math.acos(quat.w);
    const s = Math.sqrt(1 - quat.w * quat.w);
    const axis = new THREE.Vector3(quat.x, quat.y, quat.z);
    if (s>=0.001) {
        axis.multiplyScalar(1/s);
    }

    return {axis: axis, angle: angle};
}