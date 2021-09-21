'use strict';

import {Object3D, MeshPhongMaterial, Mesh, CylinderBufferGeometry, MeshBasicMaterial, SphereBufferGeometry,
    TubeBufferGeometry, Curve, Vector3, DoubleSide} from "three";
import {BufferGeometryUtils} from "three/examples/jsm/utils/BufferGeometryUtils.js"

export class FatArrow extends Object3D {
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

        const arrowMaterial = new MeshPhongMaterial({color: color, opacity: 0.9, transparent: true, polygonOffset: true,
            polygonOffsetFactor: -1.0, polygonOffsetUnits: -(markings+1)*2});
        this.line = new Mesh(this.createMarkingsGeometry(), arrowMaterial);
        this.add(this.line);

        const coneGeometry = new CylinderBufferGeometry(0, this.coneRadius, this.coneHeight, this.radialSegments, this.heightSegments);
        coneGeometry.translate(0, this.lineLength+0.5*this.coneHeight, 0);
        this.cone = new Mesh(coneGeometry, arrowMaterial);
        this.add(this.cone);
    }

    isSeen(flag) {
        this.line.material.visible = flag;
        this.cone.material.visible = flag;
    }

    dispose() {
        this.line.geometry.dispose();
        this.line.material.dispose();
        this.cone.geometry.dispose();
        this.cone.material.dispose();
    }

    createMarkingsGeometry() {
        const geometries = [];
        const lineGeometryStart = new CylinderBufferGeometry(this.lineWidth/2, this.lineWidth/2, this.markingsStart,
            this.radialSegments, this.heightSegments);
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
                    const blockGeometry = new CylinderBufferGeometry(this.lineWidth/2, this.lineWidth/2, blockLength,
                        this.radialSegments, this.heightSegments);
                    blockGeometry.translate(0, sectionStart + blockLength/2 + (i*2+1)*blockLength, 0);
                    geometries.push(blockGeometry);
                }
                break;
        }

        const lineGeometryEnd = new CylinderBufferGeometry(this.lineWidth/2, this.lineWidth/2, this.lineLength-this.markingsEnd,
            this.radialSegments, this.heightSegments);
        lineGeometryEnd.translate(0, (this.lineLength-this.markingsEnd)*0.5 + this.markingsEnd, 0);
        geometries.push(lineGeometryEnd);

        return BufferGeometryUtils.mergeBufferGeometries(geometries);
    }
}

export class Triad extends Object3D{
    static originMaterial = new MeshPhongMaterial({color: 0x000000});
    static reds = ['fee5d9', 'fcae91', 'fb6a4a', 'de2d26', 'a50f15'];
    static greens = ['edf8e9', 'bae4b3', '74c476', '31a354', '006d2c'];
    static blues = ['eff3ff', 'bdd7e7', '6baed6', '3182bd', '08519c'];
    static triadMaterialColors = ['reds', 'greens', 'blues'];

    static intFromColor(col) {
        return parseInt('0x'+col);
    }

    static colorFromDimAndIntensity(dim, intensity) {
        const colorPalette = Triad.triadMaterialColors[dim];
        return Triad.intFromColor(Triad[colorPalette][intensity]);
    }

    constructor(length, aspectRatio=0.2, colorIntensity=4, markings, markingsStart, markingsWidth) {
        super();
        this.length = length;
        this.aspectRatio = aspectRatio;
        this.colorIntensity = colorIntensity;
        this.markingsStart = markingsStart;
        this.markingsWidth = markingsWidth;
        this.markings = markings;

        const otherDims = this.aspectRatio*this.length;

        this.e1 = new FatArrow(otherDims, this.length, otherDims, otherDims, Triad.intFromColor(Triad.reds[this.colorIntensity]),
            this.markings, this.markingsStart, this.markingsStart+this.markingsWidth);
        this.e2 = new FatArrow(otherDims, this.length, otherDims, otherDims, Triad.intFromColor(Triad.greens[this.colorIntensity]),
            this.markings, this.markingsStart+this.markingsWidth, this.markingsStart+this.markingsWidth*2);
        this.e3 = new FatArrow(otherDims, this.length, otherDims, otherDims, Triad.intFromColor(Triad.blues[this.colorIntensity]),
            this.markings, this.markingsStart+this.markingsWidth*2, this.markingsStart+this.markingsWidth*3);
        this.arrows = [this.e1, this.e2, this.e3];

        const originGeometry = new SphereBufferGeometry(otherDims/2, 10, 10);
        this.origin = new Mesh(originGeometry, Triad.originMaterial);

        this.e1.rotateZ(-Math.PI/2);
        this.e3.rotateX(Math.PI/2);

        this.add(this.e1);
        this.add(this.e2);
        this.add(this.e3);
        this.add(this.origin);
        this.updateMatrixWorld(true);
    }

    isSeen(flag) {
        this.origin.material.visible = flag;
        this.arrows.forEach(arrow => arrow.isSeen(flag));
    }

    dispose() {
        // no need to dispose of the origin material since it is static
        this.origin.geometry.dispose();
        this.arrows.forEach(arrow => arrow.dispose());
    }

    arrowAxis(dim) {
        return new Vector3().setFromMatrixColumn(this.arrows[dim].matrixWorld, 1);
    }
}

export class RotAxisWithArrow extends Object3D {
    constructor(color, axisRadius, axisLength, arrowMainRadius, arrowMinorRadius, rotUnitVector, rotAngle) {
        super();
        this.color = color;
        this.axisRadius = axisRadius;
        this.axisLength = axisLength;
        this.arrowMainRadius = arrowMainRadius;
        this.arrowMinorRadius = arrowMinorRadius;
        this.axisRadialSegments = 10;
        this.axisHeightSegments = 1;
        this.tubularSegments = 20;
        this.arrowRadialSegments = 10;
        this.arrowPointerRadialSegments = 10;
        this.arrowPointerHeightSegments = 1;

        const rotAxisMaterial = new MeshBasicMaterial({color: this.color});
        const rotAxisGeometry = new CylinderBufferGeometry(this.axisRadius, this.axisRadius, this.axisLength,
            this.axisRadialSegments, this.axisHeightSegments);
        rotAxisGeometry.translate(0, this.axisLength/2, 0);
        this.axis = new Mesh(rotAxisGeometry, rotAxisMaterial);
        this.axis.updateMatrixWorld(true);
        this.axis.quaternion.setFromUnitVectors(new Vector3().setFromMatrixColumn(this.axis.matrixWorld, 1), rotUnitVector);
        this.axis.updateMatrixWorld(true);
        this.add(this.axis);

        const arcMaterial = new MeshPhongMaterial({color: this.color});
        arcMaterial.side = DoubleSide;
        const arcGeometry = new TubeBufferGeometry(new CustomCircle(this.arrowMainRadius), this.tubularSegments,
            this.arrowMinorRadius, this.arrowRadialSegments, false);
        this.arc = new Mesh(arcGeometry, arcMaterial);
        this.arc.position.set(0, this.axisLength * 0.95, 0);
        this.axis.add(this.arc);

        const arrowGeometry = new CylinderBufferGeometry(0, this.arrowMinorRadius * 2, this.arrowMinorRadius * 2,
            this.arrowPointerRadialSegments, this.arrowPointerHeightSegments, false);
        arrowGeometry.translate(0, this.arrowMinorRadius, 0);
        this.arrow = new Mesh(arrowGeometry, arcMaterial);
        this.arc.add(this.arrow);
        if (rotAngle > 0) {
            this.arrow.position.set(this.arrowMainRadius, 0, 0);
            this.arrow.quaternion.setFromUnitVectors(new Vector3().setFromMatrixColumn(this.arrow.matrixWorld, 1), new Vector3(0, 0, -1));
        } else
        {
            this.arrow.position.set(0, 0, -this.arrowMainRadius * 0.75);
            this.arrow.quaternion.setFromUnitVectors(new Vector3().setFromMatrixColumn(this.arrow.matrixWorld, 1), new Vector3(1, 0, 0));
        }
    }

    isSeen(flag) {
        this.axis.material.visible = flag;
        this.arc.material.visible = flag;
        this.arrow.material.visible = flag;
    }

    dispose() {
        this.axis.geometry.dispose();
        this.axis.material.dispose();
        this.arc.geometry.dispose();
        this.arc.material.dispose();
        this.arrow.geometry.dispose();
        this.arrow.material.dispose();
    }
}

class CustomCircle extends Curve {
    constructor(scale) {
        super();
        this.scale = scale;
    }
    getPoint(t) {
        const tx = Math.cos(0.75*2*Math.PI*t);
        const ty = 0;
        const tz = Math.sin(0.75*2*Math.PI*t);
        return new Vector3(tx, ty, tz).multiplyScalar(this.scale);
    }
}
