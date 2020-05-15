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

        const lineGeometry = new THREE.CylinderBufferGeometry(this.lineWidth, this.lineWidth, this.lineLength, 20, 1);
        lineGeometry.translate(0, this.lineLength*0.5, 0);
        this.line = new THREE.Mesh(lineGeometry, this.arrowMaterial);
        this.add(this.line);

        const coneGeometry = new THREE.CylinderBufferGeometry(0, this.coneRadius, this.coneHeight, 20, 1);
        coneGeometry.translate(0, this.lineLength+0.5*this.coneHeight, 0);
        this.cone = new THREE.Mesh(coneGeometry, this.arrowMaterial);
        this.add(this.cone);
    }
}
