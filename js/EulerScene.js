'use strict';

import * as THREE from './vendor/three.js/build/three.module.js';
import * as SceneHelpers from "./SceneHelpers.js"
import {TrackballControls} from "./vendor/three.js/examples/jsm/controls/TrackballControls.js";
import * as EulerGeometry from "./EulerGeometry.js";
import {Triad} from "./EulerGeometry.js";
import * as EulerStepStatic from "./EulerStepStatic.js";


export class EulerScene {
    static SCENE_COLOR =  0xDCDCDC;

    static setTrackballControls(trackBallControl) {
        trackBallControl.rotateSpeed = 3.0;
        trackBallControl.zoomSpeed = 1.2;
        trackBallControl.panSpeed = 0.8;
        //65:A - orbiting operations
        //83:S - zooming operations
        //68:D - panning operations
        trackBallControl.keys = [65, 83, 68];
    }

    constructor(viewElement, renderer, numFrames, camera, stepQuats) {
        this.camera = camera;
        this.stepQuats = stepQuats;
        this.viewElement = viewElement;
        this.numFrames = numFrames;
        this.renderer = renderer;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(EulerScene.SCENE_COLOR);
        this.arcHeightSegments = 1;
        this.arcStripWidth = 1;
        this.triadLength = 15;
        this.triadAspectRatio = 0.1;
        this.currentStep = 1;
        this.initScene();
        this.createSteps();
        this.goToStep(this.currentStep);
    }

    updateToFrame(frameNum) {
        this.steps[this.currentStep-1].updateToFrame(frameNum);
    }

    createSteps() {
        this.steps = this.stepQuats.map((quat, idx, array) => {
            const quatStart = idx===0 ? new THREE.Quaternion() : array[idx-1];
            const eulerStep = new EulerStep(quatStart, quat, this.numFrames, this.triadLength, this.triadAspectRatio, idx+1, this.arcStripWidth, this.numFrames, this.arcHeightSegments);
            this.addStepToScene(eulerStep);
            return eulerStep;
        }, this);
    }

    addStepToScene(step) {
        this.scene.add(step.triad);
        step.arcs.forEach(arc => this.scene.add(arc), this);
    }

    goToStep(stepNum) {
        this.currentStep = stepNum;
        for (let i=stepNum; i<this.steps.length; i++) {
            this.steps[i].deactivate();
        }

        this.steps.forEach((step, idx) => {
           if (idx <= stepNum-2) {
               step.activate();
               step.updateToFrame(step.numFrames);
           } else if (idx === stepNum -1) {
               step.activate();
               step.updateToFrame(0);
           } else {
               step.deactivate();
           }
        });
    }

    initScene() {
        if (this.camera == null) this.createCamera();
        this.createControls();
        this.createHemisphereLight();
        this.step0Triad = new EulerGeometry.Triad(this.triadLength, this.triadAspectRatio, 4, 0);
        this.scene.add(this.step0Triad);
    }

    renderSceneGraph() {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    get viewGeometry() {
        return SceneHelpers.divGeometry(this.viewElement);
    }

    updateCamera() {
        const {aspectRatio} = this.viewGeometry;
        this.camera.aspect = aspectRatio;
        this.camera.updateProjectionMatrix();
    }

    createCamera() {
        const {aspectRatio} = this.viewGeometry;
        const fov = 75;
        this.camera = new THREE.PerspectiveCamera(fov, aspectRatio, 0.1, 100);
        this.camera.position.set(0, 0, 30);
        this.camera.updateProjectionMatrix();
    }

    createControls() {
        this.controls = new TrackballControls(this.camera, this.viewElement);
        EulerScene.setTrackballControls(this.controls);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    createHemisphereLight() {
        this.hemisphereLight = new THREE.HemisphereLight(
            0xffffff, // sky color
            0x000000, // ground color
            1, // intensity
        );
        this.scene.add(this.hemisphereLight);
    }
}

class EulerStep {
    static NUM_INDICES_PER_RADIAL_SEGMENT = 6;
    static createArc = EulerStepStatic.createArc;
    static arrowGeometryFromArcGeometry = EulerStepStatic.arrowGeometryFromArcGeometry;
    static updateFlatArcArrow = EulerStepStatic.updateFlatArcArrow;

    constructor(quatStart, quatEnd, numFrames, triadLength, triadAspectRatio, stepNumber, arcStripWidth, numArcRadialSegments, arcHeightSegments) {
        this.quatStart = quatStart;
        this.quatEnd = quatEnd;
        this.numFrames = numFrames;
        this.triadLength = triadLength;
        this.triadAspectRatio = triadAspectRatio;
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
        this.arcs.forEach(arc => arc.visible=false);
    }

    activate() {
        this.triad.visible = true;
        this.arcs.forEach(arc => arc.visible=true);
    }

    createTriads() {
        this.startingTriad = new EulerGeometry.Triad(this.triadLength, this.triadAspectRatio, 4-this.stepNumber+1, this.stepNumber-1);
        this.endingTriad = new EulerGeometry.Triad(this.triadLength, this.triadAspectRatio, 4-this.stepNumber, this.stepNumber);
        this.triad = new EulerGeometry.Triad(this.triadLength, this.triadAspectRatio, 4-this.stepNumber, this.stepNumber);

        this.startingTriad.quaternion.copy(this.quatStart);
        this.triad.quaternion.copy(this.quatStart);
        this.endingTriad.quaternion.copy(this.quatEnd);

        this.startingTriad.updateMatrixWorld(true);
        this.triad.updateMatrixWorld(true);
        this.endingTriad.updateMatrixWorld(true);
    }

    createArcs() {
        const quat1Quat2Rot = new THREE.Quaternion().multiplyQuaternions(this.endingTriad.quaternion, new THREE.Quaternion().copy(this.startingTriad.quaternion).conjugate());
        const {axis: rotAxis, angle: rotAngle} = EulerGeometry.axisAngleFromQuat(quat1Quat2Rot);
        const rotPlane = new THREE.Plane(rotAxis);
        this.rotAxis = rotAxis;
        this.rotAngle = rotAngle;
        this.rotPlane = rotPlane;

        const arcsStartingDistance = this.triadLength * (2/3);
        for(let dim=0; dim<3; dim++) {
            const arcMaterial = new THREE.MeshBasicMaterial({color: Triad.intFromColor(Triad[Triad.triadMaterialColors[dim]][this.startingTriad.colorIntensity]), depthTest: false});
            arcMaterial.side = THREE.DoubleSide;
            this.arcs[dim] = EulerStep.createArc(this.startingTriad, this.endingTriad, this.rotAxis, this.rotAngle, this.rotPlane,
                dim, arcsStartingDistance+dim*2*this.arcStripWidth, this.arcStripWidth, arcMaterial, this.numArcRadialSegments, this.arcHeightSegments);
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
}