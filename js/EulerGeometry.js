'use strict';

import * as THREE from "./vendor/three.js/build/three.module.js";

export class FatArrow extends THREE.Object3D {
    constructor(lineWidth, lineLength, coneRadius, coneHeight, color) {
        super();
        this.lineWidth = lineWidth;
        this.lineLength = lineLength;
        this.coneRadius = coneRadius;
        this.coneHeight = coneHeight;
        this.color = color;

        this.arrowMaterial = new THREE.MeshPhongMaterial({color: this.color, opacity: 0.7, transparent: true});

        const lineGeometry = new THREE.CylinderBufferGeometry(this.lineWidth/2, this.lineWidth/2, this.lineLength, 20, 1);
        lineGeometry.translate(0, this.lineLength*0.5, 0);
        this.line = new THREE.Mesh(lineGeometry, this.arrowMaterial);
        this.add(this.line);

        const coneGeometry = new THREE.CylinderBufferGeometry(0, this.coneRadius, this.coneHeight, 20, 1);
        coneGeometry.translate(0, this.lineLength+0.5*this.coneHeight, 0);
        this.cone = new THREE.Mesh(coneGeometry, this.arrowMaterial);
        this.add(this.cone);
    }
}

export class Triad extends THREE.Object3D{
    static e1_color = 0xff0000;
    static e2_color = 0x00ff00;
    static e3_color = 0x0000ff;
    static widthLengthRatio = 0.2;
    static originMaterial = new THREE.MeshPhongMaterial({color: 0x000000});

    constructor(length) {
        super();
        this.length = length;
        const otherDims = Triad.widthLengthRatio*this.length;
        this.e1 = new FatArrow(otherDims, this.length, otherDims, otherDims, Triad.e1_color);
        this.e2 = new FatArrow(otherDims, this.length, otherDims, otherDims, Triad.e2_color);
        this.e3 = new FatArrow(otherDims, this.length, otherDims, otherDims, Triad.e3_color);

        const originGeometry = new THREE.SphereBufferGeometry(otherDims/2, 10, 10);
        this.origin = new THREE.Mesh(originGeometry, Triad.originMaterial);

        this.e1.rotateZ(-Math.PI/2);
        this.e3.rotateX(Math.PI/2);

        this.add(this.e1);
        this.add(this.e2);
        this.add(this.e3);
        this.add(this.origin);
    }
}