'use strict';

import {createArc, arrowGeometryFromArcGeometry, updateFlatArcArrow}  from "./EulerStepStatic.js";
import {Quaternion, Plane, MeshBasicMaterial, DoubleSide, Mesh} from "three";
import {Triad, RotAxisWithArrow} from "./EulerGeometry.js";

export class EulerStep {
    static NUM_INDICES_PER_RADIAL_SEGMENT = 6;
    static createArc = createArc;
    static arrowGeometryFromArcGeometry = arrowGeometryFromArcGeometry;
    static updateFlatArcArrow = updateFlatArcArrow;

    constructor(quatStart, rotation, numFrames, triadLength, triadAspectRatio, markingsStart, stepNumber, arcStripWidth, numArcRadialSegments, arcHeightSegments) {
        this.quatStart = quatStart;
        this.rotation = rotation;
        this.quatEnd = new Quaternion().setFromAxisAngle(rotation.axis, rotation.angle).multiply(quatStart);
        this.numFrames = numFrames;
        this.triadLength = triadLength;
        this.triadAspectRatio = triadAspectRatio;
        this.markingsStart = markingsStart;
        this.stepNumber = stepNumber;
        this.arcStripWidth = arcStripWidth;
        this.numArcRadialSegments = numArcRadialSegments;
        this.arcHeightSegments = arcHeightSegments;
        this.arrowSegmentLength = [];
        this.arrowSegmentOffset = [];
        this.arcs = [];
        this.arcArrows = [];

        this.createTriads();
        this.createArcs();
        this.createArcArrows();
        this.createRotAxis();
    }

    dispose() {
        this.startingTriad.dispose();
        this.endingTriad.dispose();
        this.triad.dispose();
        this.arcs.forEach(arc => {
            arc.geometry.dispose();
            arc.material.dispose();
        });
        this.arcArrows.forEach(arcArrow => {
            arcArrow.geometry.dispose();
            arcArrow.material.dispose();
        });
        this.rotAxis.dispose();
    }

    updateToFrame(frameNum) {
        this.updateTriad(frameNum);
        this.updateToFrameFlatArrows(frameNum);
    }

    updateTriad(frameNum) {
        const currentFrame = Math.floor(frameNum);
        if (currentFrame>=this.numFrames) {
            this.triad.quaternion.copy(this.endingTriad.quaternion);
        } else {
            const interpFactor = frameNum/this.numFrames;
            Quaternion.slerp(this.startingTriad.quaternion, this.endingTriad.quaternion, this.triad.quaternion, interpFactor);
        }
    }

    updateToFrameFlatArrows(frameNum) {
        const currentFrame = Math.floor(frameNum);
        if (currentFrame>=this.numFrames) {
            const drawRange = this.numFrames*this.arcHeightSegments*EulerStep.NUM_INDICES_PER_RADIAL_SEGMENT;
            this.arcs.forEach(arc => arc.geometry.setDrawRange(0, drawRange));
            this.arcArrows.forEach((arcArrow, idx) => {
                EulerStep.updateFlatArcArrow(arcArrow, this.arcs[idx].geometry, drawRange, this.numFrames, this.arcHeightSegments,
                    this.arrowSegmentLength[idx], this.arrowSegmentOffset[idx]);
                arcArrow.visible = true;
            });
        }
        else {
            const interpFactor = frameNum/this.numFrames;
            const drawRangeContinous = interpFactor*this.numFrames*this.arcHeightSegments*EulerStep.NUM_INDICES_PER_RADIAL_SEGMENT;
            //restrict drawRange to a complete segment
            const drawRange = drawRangeContinous - drawRangeContinous % (this.arcHeightSegments*EulerStep.NUM_INDICES_PER_RADIAL_SEGMENT);

            if (drawRange > 0) {
                this.arcs.forEach(arc => arc.geometry.setDrawRange(0, drawRange));
                this.arcArrows.forEach((arcArrow, idx) => {
                    if (drawRange >= this.arrowSegmentLength[idx]*this.arcHeightSegments*EulerStep.NUM_INDICES_PER_RADIAL_SEGMENT) {
                        EulerStep.updateFlatArcArrow(arcArrow, this.arcs[idx].geometry, drawRange, this.numFrames, this.arcHeightSegments,
                            this.arrowSegmentLength[idx], this.arrowSegmentOffset[idx]);
                        arcArrow.visible = true;
                    }
                    else {
                        arcArrow.visible=false;
                    }
                });
            }
            else {
                this.arcs.forEach(arc => arc.geometry.setDrawRange(0, 0));
                this.arcArrows.forEach(arcArrow => arcArrow.visible=false);
            }
        }
    }

    isSeen(flag) {
        this.triad.isSeen(flag);
        this.rotAxis.isSeen(flag);
        this.arcs.forEach(arc => arc.material.visible = flag);
        this.arcArrows.forEach(arcArrow => arcArrow.material.visible = flag);
    }

    deactivate() {
        this.triad.visible = false;
        this.rotAxis.visible = false;
        this.arcs.forEach(arc => arc.visible=false);
    }

    activate() {
        this.rotAxis.visible = true;
        this.triad.visible = true;
        this.arcs.forEach(arc => arc.visible=true);
    }

    createTriads() {
        this.startingTriad = new Triad(this.triadLength, this.triadAspectRatio, 0, 0, this.markingsStart, this.arcStripWidth*3);
        this.endingTriad = new Triad(this.triadLength, this.triadAspectRatio, 0, 0, this.markingsStart, this.arcStripWidth*3);
        this.triad = new Triad(this.triadLength, this.triadAspectRatio, this.stepNumber+1,
            this.stepNumber, this.markingsStart, this.arcStripWidth*3);

        this.startingTriad.quaternion.copy(this.quatStart);
        this.triad.quaternion.copy(this.quatStart);
        this.endingTriad.quaternion.copy(this.quatEnd);

        this.startingTriad.updateMatrixWorld(true);
        this.triad.updateMatrixWorld(true);
        this.endingTriad.updateMatrixWorld(true);
    }

    createArcs() {
        const rotPlane = new Plane(this.rotation.axis);
        const arcsStartingDistance = this.markingsStart + this.arcStripWidth;
        for(let dim=0; dim<3; dim++) {
            const arcMaterial = new MeshBasicMaterial({color: Triad.colorFromDimAndIntensity(dim, this.triad.colorIntensity), depthTest: false});
            arcMaterial.side = DoubleSide;
            this.arcs[dim] = EulerStep.createArc(this.startingTriad, this.endingTriad, this.rotation.axis, this.rotation.angle, rotPlane,
                dim, arcsStartingDistance+3*dim*this.arcStripWidth, this.arcStripWidth, arcMaterial, this.numArcRadialSegments, this.arcHeightSegments);
            this.arcs[dim].renderOrder = 0;
            this.arcs[dim].updateWorldMatrix(true);
        }
    }

    createArcArrows() {
        const arcArrowMaterial = new MeshBasicMaterial({color: 0xffffff, depthTest: false});
        arcArrowMaterial.side = DoubleSide;

        for (let dim=0; dim<3; dim++) {
            // we will need a different arrow geometry for each arc because the radii etc. vary and will change the arrow dimensions
            const {arrowGeometry, arrowSegmentLength, arrowSegmentOffsetLength} =
                EulerStep.arrowGeometryFromArcGeometry(this.arcs[dim].geometry, this.numArcRadialSegments, this.arcHeightSegments, this.arcStripWidth, this.triadLength*this.triadAspectRatio/2);
            this.arrowSegmentLength[dim] = arrowSegmentLength;
            this.arrowSegmentOffset[dim] = arrowSegmentOffsetLength;
            this.arcArrows[dim] = new Mesh(arrowGeometry, arcArrowMaterial);
            this.arcArrows[dim].renderOrder = 1;
            this.arcs[dim].add(this.arcArrows[dim]);
            this.arcArrows[dim].visible = false;
        }
    }

    createRotAxis() {
        const rotAxisColor = Triad.colorFromDimAndIntensity(this.stepNumber-1, this.triad.colorIntensity);
        const axisRadius = this.triadLength * this.triadAspectRatio * 0.1;
        const axisLength = this.triadLength * 1.25;
        const arrowMainRadius = this.triadLength*this.triadAspectRatio * 0.75;
        const arrowMinorRadius = this.arcStripWidth * 0.25;
        this.rotAxis = new RotAxisWithArrow(rotAxisColor, axisRadius, axisLength, arrowMainRadius, arrowMinorRadius,
            this.rotation.axis, this.rotation.angle);
    }
}
