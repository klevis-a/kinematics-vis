'use strict';

import * as THREE from './vendor/three.js/build/three.module.js';
import * as SceneHelpers from "./SceneHelpers.js"
import {TrackballControls} from "./vendor/three.js/examples/jsm/controls/TrackballControls.js";
import * as EulerGeometry from "./EulerGeometry.js";
import * as JSHelpers from "./JSHelpers.js"
import {Triad} from "./EulerGeometry.js";

export class EulerScene {
    static setTrackballControls(trackBallControl) {
        trackBallControl.rotateSpeed = 3.0;
        trackBallControl.zoomSpeed = 1.2;
        trackBallControl.panSpeed = 0.8;
        //65:A - orbiting operations
        //83:S - zooming operations
        //68:D - panning operations
        trackBallControl.keys = [65, 83, 68];
    }

    static SCENE_COLOR =  0xDCDCDC;

    constructor(viewElement, canvasElement, numFrames) {
        this.viewElement = viewElement;
        this.canvasElement = canvasElement;
        this.numFrames = numFrames;
        this.renderer = new THREE.WebGLRenderer({canvas: canvasElement});
        this.renderer.shadowMap.enabled = true;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(EulerScene.SCENE_COLOR);
        this.initScene();
    }

    updateToFrame(frameNum) {
        const currentFrame = Math.floor(frameNum);
        if (currentFrame>=this.numFrames) {
            this.triad2.quaternion.copy(this.triad2_final.quaternion);
            this.arcE1.geometry.setDrawRange(0, this.numFrames*6);
            this.arcE2.geometry.setDrawRange(0, this.numFrames*6);
            this.arcE3.geometry.setDrawRange(0, this.numFrames*6);
        }
        else {
            const interpFactor = frameNum/this.numFrames;
            THREE.Quaternion.slerp(this.triad1.quaternion, this.triad2_final.quaternion, this.triad2.quaternion, interpFactor);
            const drawRange = interpFactor*this.numFrames*6;
            this.arcE1.geometry.setDrawRange(0, drawRange);
            this.arcE2.geometry.setDrawRange(0, drawRange);
            this.arcE3.geometry.setDrawRange(0, drawRange);
        }
    }

    initScene() {
        this.createCamera();
        this.createControls();
        this.createHemisphereLight();
        this.createTriads();
        this.createArcs(this.triad1, this.triad2_final);
    }

    resizeRendererToDisplaySize() {
        const width = this.canvasElement.clientWidth;
        const height = this.canvasElement.clientHeight;
        const needResize = this.renderer.width !== width || this.renderer.height !== height;
        if (needResize) {
            this.renderer.setSize(width, height, false);
        }
        return needResize;
    }

    renderSceneGraph() {
        this.resizeRendererToDisplaySize();
        this.camera.updateProjectionMatrix();
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    get viewGeometry() {
        return SceneHelpers.divGeometry(this.viewElement);
    }

    createCamera() {
        const {aspectRatio} = this.viewGeometry;
        const fov = 75;
        this.camera = new THREE.PerspectiveCamera(fov, aspectRatio, 0.1, 100);
        this.camera.position.set(0, 0, 30);
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
        this.triad1 = new EulerGeometry.Triad(15,0.1,4);
        this.scene.add(this.triad1);

        this.triad2 = new EulerGeometry.Triad(15,0.1,3, 0xffffff);
        this.scene.add(this.triad2);

        //create the final triad for now - it's going to make computations easier but can likely remove it later
        const rotX = JSHelpers.getRandom(-Math.PI, Math.PI);
        const rotY = JSHelpers.getRandom(-Math.PI/2, Math.PI/2);
        const rotZ = JSHelpers.getRandom(-Math.PI, Math.PI);
        this.triad2_final = new EulerGeometry.Triad(15,0.1,3, 0xffffff);
        this.triad2_final.rotateX(rotX);
        this.triad2_final.updateMatrixWorld(true);
        this.triad2_final.rotateY(rotY);
        this.triad2_final.updateMatrixWorld(true);
        this.triad2_final.rotateZ(rotZ);
        this.triad2_final.updateMatrixWorld(true);
    }

    createArcs(triad1, triad2) {
        const arcMaterialE1 = new THREE.MeshBasicMaterial({color: Triad.intFromColor(Triad.reds[triad1.colorIntensity])});
        arcMaterialE1.side = THREE.DoubleSide;
        const arcMaterialE2 = new THREE.MeshBasicMaterial({color: Triad.intFromColor(Triad.greens[triad1.colorIntensity])});
        arcMaterialE2.side = THREE.DoubleSide;
        const arcMaterialE3 = new THREE.MeshBasicMaterial({color: Triad.intFromColor(Triad.blues[triad1.colorIntensity])});
        arcMaterialE3.side = THREE.DoubleSide;

        const {axis: axisE1, angle: angleE1} = EulerGeometry.axisAngleFromQuat(new THREE.Quaternion().setFromUnitVectors(triad1.arrowAxis(0), triad2.arrowAxis(0)));
        const arcGeometryE1 = new THREE.RingBufferGeometry(10, 11, this.numFrames, 1, 0, angleE1);
        arcGeometryE1.setDrawRange(0, 0);
        this.arcE1 = new THREE.Mesh(arcGeometryE1, arcMaterialE1);
        //x-axis of wedge is the starting "point"
        const arcE1_XAxis = triad1.arrowAxis(0);
        //z-axis of wedge is the rotAxis
        const arcE1_ZAxis = axisE1;
        //and the y-axis is created from the cross-product
        const arcE1_YAxis = new THREE.Vector3().crossVectors(arcE1_ZAxis, arcE1_XAxis);
        this.arcE1.setRotationFromMatrix(new THREE.Matrix4().makeBasis(arcE1_XAxis, arcE1_YAxis, arcE1_ZAxis));
        this.scene.add(this.arcE1);

        const {axis: axisE2, angle: angleE2} = EulerGeometry.axisAngleFromQuat(new THREE.Quaternion().setFromUnitVectors(triad1.arrowAxis(1), triad2.arrowAxis(1)));
        const arcGeometryE2 = new THREE.RingBufferGeometry(12, 13, this.numFrames, 1, 0, angleE2);
        arcGeometryE2.setDrawRange(0, 0);
        this.arcE2 = new THREE.Mesh(arcGeometryE2, arcMaterialE2);
        //x-axis of wedge is the starting "point"
        const arcE2_XAxis = triad1.arrowAxis(1);
        //z-axis of wedge is the rotAxis
        const arcE2_ZAxis = axisE2;
        //and the y-axis is created from the cross-product
        const arcE2_YAxis = new THREE.Vector3().crossVectors(arcE2_ZAxis, arcE2_XAxis);
        this.arcE2.setRotationFromMatrix(new THREE.Matrix4().makeBasis(arcE2_XAxis, arcE2_YAxis, arcE2_ZAxis));
        this.scene.add(this.arcE2);

        const {axis: axisE3, angle: angleE3} = EulerGeometry.axisAngleFromQuat(new THREE.Quaternion().setFromUnitVectors(triad1.arrowAxis(2), triad2.arrowAxis(2)));
        const arcGeometryE3 = new THREE.RingBufferGeometry(14, 15, this.numFrames, 1, 0, angleE3);
        arcGeometryE3.setDrawRange(0, 0);
        this.arcE3 = new THREE.Mesh(arcGeometryE3, arcMaterialE3);
        //x-axis of wedge is the starting "point"
        const arcE3_XAxis = triad1.arrowAxis(2);
        //z-axis of wedge is the rotAxis
        const arcE3_ZAxis = axisE3;
        //and the y-axis is created from the cross-product
        const arcE3_YAxis = new THREE.Vector3().crossVectors(arcE3_ZAxis, arcE3_XAxis);
        this.arcE3.setRotationFromMatrix(new THREE.Matrix4().makeBasis(arcE3_XAxis, arcE3_YAxis, arcE3_ZAxis));
        this.scene.add(this.arcE3);

        const quat1Quat2Rot = new THREE.Quaternion().multiplyQuaternions(triad2.quaternion, new THREE.Quaternion().copy(triad1.quaternion).conjugate());
        const {axis: rotAxis} = EulerGeometry.axisAngleFromQuat(quat1Quat2Rot);
        const points = [new THREE.Vector3().copy(rotAxis).multiplyScalar(-25), new THREE.Vector3().copy(rotAxis).multiplyScalar(25)];
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({color: 0xffffff});
        this.scene.add(new THREE.Line(lineGeometry, lineMaterial));
    }
}