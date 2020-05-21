'use strict';

import * as THREE from "./vendor/three.js/build/three.module.js";
import {BufferGeometryUtils} from "./vendor/three.js/examples/jsm/utils/BufferGeometryUtils.js"

export class FatArrow extends THREE.Object3D {
    constructor(lineWidth, lineLength, coneRadius, coneHeight, color, markings, markingsStart, markingsEnd) {
        super();
        this.lineWidth = lineWidth;
        this.lineLength = lineLength;
        this.coneRadius = coneRadius;
        this.coneHeight = coneHeight;
        this.markings = markings;
        this.markingsStart = markingsStart;
        this.markingsEnd = markingsEnd;
        this.radialSegments = 10;
        this.heightSegments = 1;

        this.arrowMaterial = new THREE.MeshPhongMaterial({color: color, opacity: 0.9, transparent: true});
        this.line = new THREE.Mesh(this.createMarkingsGeometry(), this.arrowMaterial);
        this.add(this.line);

        const coneGeometry = new THREE.CylinderBufferGeometry(0, this.coneRadius, this.coneHeight, this.radialSegments, this.heightSegments);
        coneGeometry.translate(0, this.lineLength+0.5*this.coneHeight, 0);
        this.cone = new THREE.Mesh(coneGeometry, this.arrowMaterial);
        this.add(this.cone);
    }

    createMarkingsGeometry() {
        const geometries = [];
        const lineGeometryStart = new THREE.CylinderBufferGeometry(this.lineWidth/2, this.lineWidth/2, this.markingsStart, this.radialSegments, this.heightSegments);
        lineGeometryStart.translate(0, this.markingsStart*0.5, 0);
        geometries.push(lineGeometryStart);

        switch (this.markings) {
            case 1:
            case 2:
            case 3:
                const sectionLength = (this.markingsEnd - this.markingsStart)/3;
                const sectionStart = this.markingsStart + (this.markings - 1) * sectionLength;
                const blockLength = sectionLength/(this.markings * 2 + 1);
                for (let i=0; i<this.markings; i++) {
                    const blockGeometry = new THREE.CylinderBufferGeometry(this.lineWidth/2, this.lineWidth/2, blockLength, this.radialSegments, this.heightSegments);
                    blockGeometry.translate(0, sectionStart + blockLength/2 + (i*2+1)*blockLength, 0);
                    geometries.push(blockGeometry);
                }
                break;
        }

        const lineGeometryEnd = new THREE.CylinderBufferGeometry(this.lineWidth/2, this.lineWidth/2, this.lineLength-this.markingsEnd, this.radialSegments, this.heightSegments);
        lineGeometryEnd.translate(0, (this.lineLength-this.markingsEnd)*0.5 + this.markingsEnd, 0);
        geometries.push(lineGeometryEnd);

        return BufferGeometryUtils.mergeBufferGeometries(geometries);
    }
}

export class Triad extends THREE.Object3D{
    static originMaterial = new THREE.MeshPhongMaterial({color: 0x000000});
    static reds = palette('cb-Reds',5);
    static greens = palette('cb-Greens',5);
    static blues = palette('cb-Blues',5);
    static triadMaterialColors = ['reds', 'greens', 'blues'];

    static intFromColor(col) {
        return parseInt('0x'+col);
    }

    constructor(length, aspectRatio=0.2, colorIntensity=4, markings, markingsStart, markingsWidth) {
        super();
        this.length = length;
        this.aspectRatio = aspectRatio;
        this.colorIntensity = colorIntensity;
        this.markingsStart = markingsStart
        this.markingsWidth = markingsWidth;
        this.markings = markings;

        const otherDims = this.aspectRatio*this.length;

        this.e1 = new FatArrow(otherDims, this.length, otherDims, otherDims, Triad.intFromColor(Triad.reds[this.colorIntensity]), this.markings, this.markingsStart, this.markingsStart+this.markingsWidth);
        this.e2 = new FatArrow(otherDims, this.length, otherDims, otherDims, Triad.intFromColor(Triad.greens[this.colorIntensity]), this.markings, this.markingsStart+this.markingsWidth, this.markingsStart+this.markingsWidth*2);
        this.e3 = new FatArrow(otherDims, this.length, otherDims, otherDims, Triad.intFromColor(Triad.blues[this.colorIntensity]), this.markings, this.markingsStart+this.markingsWidth*2, this.markingsStart+this.markingsWidth*3);
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
    let angle = 2 * Math.acos(quat.w);
    angle = angle > Math.PI ? -(2*Math.PI-angle) : angle;
    const s = Math.sqrt(1 - quat.w * quat.w);
    const axis = new THREE.Vector3(quat.x, quat.y, quat.z);
    if (s>=0.001) {
        axis.multiplyScalar(1/s);
    }

    return {axis: axis, angle: angle};
}