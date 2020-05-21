'use strict';

import * as THREE from './vendor/three.js/build/three.module.js';
import * as SceneHelpers from "./SceneHelpers.js"
import {TrackballControls} from "./vendor/three.js/examples/jsm/controls/TrackballControls.js";
import * as EulerGeometry from "./EulerGeometry.js";
import * as JSHelpers from "./JSHelpers.js"
import {Triad} from "./EulerGeometry.js";
import * as EulerSceneStatic from "./EulerSceneStatic.js";


export class EulerScene {
    static SCENE_COLOR =  0xDCDCDC;
    static NUM_INDICES_PER_RADIAL_SEGMENT = 6;

    static createArc = EulerSceneStatic.createArc;
    static arrowGeometryFromArcGeometry = EulerSceneStatic.arrowGeometryFromArcGeometry;
    static setTrackballControls = EulerSceneStatic.setTrackballControls;
    static updateFlatArcArrow = EulerSceneStatic.updateFlatArcArrow;

    constructor(viewElement, renderer, numFrames, camera) {
        this.camera = camera;
        this.viewElement = viewElement;
        this.numFrames = numFrames;
        this.renderer = renderer;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(EulerScene.SCENE_COLOR);
        this.arcHeightSegments = 1;
        this.arrowSegmentLength = [];
        this.arrowSegmentOffset = [];
        this.stripWidth = 1;
        this.arcs = [];
        this.arcArrows = [];
        this.triadLength = 15;
        this.triadAspectRatio = 0.1;
        this.initScene();
    }

    updateToFrame(frameNum) {
        this.updateTriad(frameNum);
        this.updateToFrameFlatArrows(frameNum);
    }

    updateTriad(frameNum) {
        const currentFrame = Math.floor(frameNum);
        if (currentFrame>=this.numFrames) {
            this.triad2.quaternion.copy(this.triad2_final.quaternion);
        } else {
            const interpFactor = frameNum/this.numFrames;
            THREE.Quaternion.slerp(this.triad1.quaternion, this.triad2_final.quaternion, this.triad2.quaternion, interpFactor);
        }
    }

    updateToFrameFlatArrows(frameNum) {
        const currentFrame = Math.floor(frameNum);
        if (currentFrame>=this.numFrames) {
            const drawRange = this.numFrames*this.arcHeightSegments*EulerScene.NUM_INDICES_PER_RADIAL_SEGMENT;
            this.arcs.forEach(arc => arc.geometry.setDrawRange(0, drawRange));
            this.arcArrows.forEach((arcArrow, idx) => {
                EulerScene.updateFlatArcArrow(arcArrow, this.arcs[idx].geometry, drawRange, this.numFrames, this.arcHeightSegments, this.arrowSegmentLength[idx], this.arrowSegmentOffset[idx]);
                arcArrow.visible = true;
            });
        }
        else {
            const interpFactor = frameNum/this.numFrames;
            const drawRangeContinous = interpFactor*this.numFrames*this.arcHeightSegments*EulerScene.NUM_INDICES_PER_RADIAL_SEGMENT;
            //restrict drawRange to a complete segment
            const drawRange = drawRangeContinous - drawRangeContinous % (this.arcHeightSegments*EulerScene.NUM_INDICES_PER_RADIAL_SEGMENT);

            if (drawRange > 0) {
                this.arcs.forEach(arc => arc.geometry.setDrawRange(0, drawRange));
                this.arcArrows.forEach((arcArrow, idx) => {
                    if (drawRange >= this.arrowSegmentLength[idx]*this.arcHeightSegments*EulerScene.NUM_INDICES_PER_RADIAL_SEGMENT) {
                        EulerScene.updateFlatArcArrow(arcArrow, this.arcs[idx].geometry, drawRange, this.numFrames, this.arcHeightSegments, this.arrowSegmentLength[idx], this.arrowSegmentOffset[idx]);
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

    initScene() {
        if (this.camera == null) this.createCamera();
        this.createControls();
        this.createHemisphereLight();
        this.createTriads();
        this.createArcs(this.triad1, this.triad2_final);
        this.createArcArrows();
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

    createTriads() {
        this.triad1 = new EulerGeometry.Triad(this.triadLength,this.triadAspectRatio,4,0);
        this.scene.add(this.triad1);

        this.triad2 = new EulerGeometry.Triad(this.triadLength,this.triadAspectRatio,3,1);
        this.triad2.position.set(0.001,0.001,0.001);
        this.scene.add(this.triad2);

        //create the final triad for now - it's going to make computations easier but can likely remove it later
        const rotX = JSHelpers.getRandom(-Math.PI, Math.PI);
        //const rotY = JSHelpers.getRandom(-Math.PI/2, Math.PI/2);
        //const rotZ = JSHelpers.getRandom(-Math.PI, Math.PI);
        this.triad2_final = new EulerGeometry.Triad(this.triadLength,this.triadAspectRatio,3,0);
        this.triad2_final.rotateX(rotX);
        this.triad2_final.updateMatrixWorld(true);
    }

    createArcs(triad1, triad2) {
        const quat1Quat2Rot = new THREE.Quaternion().multiplyQuaternions(triad2.quaternion, new THREE.Quaternion().copy(triad1.quaternion).conjugate());
        const {axis: rotAxis, angle: rotAngle} = EulerGeometry.axisAngleFromQuat(quat1Quat2Rot);
        const rotPlane = new THREE.Plane(rotAxis);

        const triadMaterialColors = ['reds', 'greens', 'blues'];
        for(let dim=0; dim<3; dim++) {
            const arcMaterial = new THREE.MeshBasicMaterial({color: Triad.intFromColor(Triad[triadMaterialColors[dim]][triad1.colorIntensity]), depthTest: false});
            arcMaterial.side = THREE.DoubleSide;
            this.arcs[dim] = EulerScene.createArc(triad1, triad2, rotAxis, rotAngle, rotPlane, dim, 10+dim*2, 11+dim*2, this.stripWidth, arcMaterial, this.numFrames, this.arcHeightSegments);
            this.arcs[dim].renderOrder = 0;
            this.arcs[dim].updateWorldMatrix(true);
            this.scene.add(this.arcs[dim]);
        }
    }

    createArcArrows() {
        const arcArrowMaterial = new THREE.MeshBasicMaterial({color: 0xffffff, depthTest: false});
        arcArrowMaterial.side = THREE.DoubleSide;

        for (let dim=0; dim<3; dim++) {
            // we will need a different arrow geometry for each arc because the radii etc. vary and will change the arrow dimensions
            const {arrowGeometry, arrowSegmentLength, arrowSegmentOffsetLength} = EulerScene.arrowGeometryFromArcGeometry(this.arcs[dim].geometry, this.numFrames, this.arcHeightSegments, this.stripWidth, this.triadLength*this.triadAspectRatio/2);
            this.arrowSegmentLength[dim] = arrowSegmentLength;
            this.arrowSegmentOffset[dim] = arrowSegmentOffsetLength;
            this.arcArrows[dim] = new THREE.Mesh(arrowGeometry, arcArrowMaterial);
            this.arcArrows[dim].renderOrder = 1;
            this.arcs[dim].add(this.arcArrows[dim]);
            this.arcArrows[dim].visible = false;
        }
    }
}