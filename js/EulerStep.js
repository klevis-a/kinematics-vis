import * as EulerStepStatic from "./EulerStepStatic.js";
import * as THREE from "./vendor/three.js/build/three.module.js";
import * as EulerGeometry from "./EulerGeometry.js";

export class EulerStep {
    static NUM_INDICES_PER_RADIAL_SEGMENT = 6;
    static createArc = EulerStepStatic.createArc;
    static arrowGeometryFromArcGeometry = EulerStepStatic.arrowGeometryFromArcGeometry;
    static updateFlatArcArrow = EulerStepStatic.updateFlatArcArrow;

    constructor(quatStart, rotation, numFrames, triadLength, triadAspectRatio, markingsStart, stepNumber, arcStripWidth, numArcRadialSegments, arcHeightSegments) {
        this.quatStart = quatStart;
        this.rotation = rotation;
        this.quatEnd = new THREE.Quaternion().setFromAxisAngle(rotation.axis, rotation.angle).multiply(quatStart);
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
            THREE.Quaternion.slerp(this.startingTriad.quaternion, this.endingTriad.quaternion, this.triad.quaternion, interpFactor);
        }
    }

    updateToFrameFlatArrows(frameNum) {
        const currentFrame = Math.floor(frameNum);
        if (currentFrame>=this.numFrames) {
            const drawRange = this.numFrames*this.arcHeightSegments*EulerStep.NUM_INDICES_PER_RADIAL_SEGMENT;
            this.arcs.forEach(arc => arc.geometry.setDrawRange(0, drawRange));
            this.arcArrows.forEach((arcArrow, idx) => {
                EulerStep.updateFlatArcArrow(arcArrow, this.arcs[idx].geometry, drawRange, this.numFrames, this.arcHeightSegments, this.arrowSegmentLength[idx], this.arrowSegmentOffset[idx]);
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
                        EulerStep.updateFlatArcArrow(arcArrow, this.arcs[idx].geometry, drawRange, this.numFrames, this.arcHeightSegments, this.arrowSegmentLength[idx], this.arrowSegmentOffset[idx]);
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
        this.startingTriad = new EulerGeometry.Triad(this.triadLength, this.triadAspectRatio, 0, 0, this.markingsStart, this.arcStripWidth*3);
        this.endingTriad = new EulerGeometry.Triad(this.triadLength, this.triadAspectRatio, 0, 0, this.markingsStart, this.arcStripWidth*3);
        this.triad = new EulerGeometry.Triad(this.triadLength, this.triadAspectRatio, this.stepNumber+1,
            this.stepNumber, this.markingsStart, this.arcStripWidth*3);

        this.startingTriad.quaternion.copy(this.quatStart);
        this.triad.quaternion.copy(this.quatStart);
        this.endingTriad.quaternion.copy(this.quatEnd);

        this.startingTriad.updateMatrixWorld(true);
        this.triad.updateMatrixWorld(true);
        this.endingTriad.updateMatrixWorld(true);
    }

    createArcs() {
        const rotPlane = new THREE.Plane(this.rotation.axis);
        const arcsStartingDistance = this.markingsStart + this.arcStripWidth;
        for(let dim=0; dim<3; dim++) {
            const arcMaterial = new THREE.MeshBasicMaterial({color: EulerGeometry.Triad.colorFromDimAndIntensity(dim, this.triad.colorIntensity), depthTest: false});
            arcMaterial.side = THREE.DoubleSide;
            this.arcs[dim] = EulerStep.createArc(this.startingTriad, this.endingTriad, this.rotation.axis, this.rotation.angle, rotPlane,
                dim, arcsStartingDistance+3*dim*this.arcStripWidth, this.arcStripWidth, arcMaterial, this.numArcRadialSegments, this.arcHeightSegments);
            this.arcs[dim].renderOrder = 0;
            this.arcs[dim].updateWorldMatrix(true);
        }
    }

    createArcArrows() {
        const arcArrowMaterial = new THREE.MeshBasicMaterial({color: 0xffffff, depthTest: false});
        arcArrowMaterial.side = THREE.DoubleSide;

        for (let dim=0; dim<3; dim++) {
            // we will need a different arrow geometry for each arc because the radii etc. vary and will change the arrow dimensions
            const {arrowGeometry, arrowSegmentLength, arrowSegmentOffsetLength} =
                EulerStep.arrowGeometryFromArcGeometry(this.arcs[dim].geometry, this.numArcRadialSegments, this.arcHeightSegments, this.arcStripWidth, this.triadLength*this.triadAspectRatio/2);
            this.arrowSegmentLength[dim] = arrowSegmentLength;
            this.arrowSegmentOffset[dim] = arrowSegmentOffsetLength;
            this.arcArrows[dim] = new THREE.Mesh(arrowGeometry, arcArrowMaterial);
            this.arcArrows[dim].renderOrder = 1;
            this.arcs[dim].add(this.arcArrows[dim]);
            this.arcArrows[dim].visible = false;
        }
    }

    createRotAxis() {
        const rotAxisColor = EulerGeometry.Triad.colorFromDimAndIntensity(this.stepNumber-1, this.triad.colorIntensity);
        const axisRadius = this.triadLength * this.triadAspectRatio * 0.1;
        const axisLength = this.triadLength * 1.25;
        const arrowMainRadius = this.triadLength*this.triadAspectRatio * 0.75;
        const arrowMinorRadius = this.arcStripWidth * 0.25;
        this.rotAxis = new EulerGeometry.RotAxisWithArrow(rotAxisColor, axisRadius, axisLength, arrowMainRadius, arrowMinorRadius, this.rotation.axis, this.rotation.angle);
    }
}
