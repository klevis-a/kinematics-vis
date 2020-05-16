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

    constructor(viewElement, canvasElement) {
        this.viewElement = viewElement;
        this.canvasElement = canvasElement;
        this.renderer = new THREE.WebGLRenderer({canvas: canvasElement});
        this.renderer.shadowMap.enabled = true;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(EulerScene.SCENE_COLOR);
        this.initScene();
    }

    initScene() {
        this.createCamera();
        this.createControls();
        this.createHemisphereLight();
        this.createTriad();
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

    renderScene() {
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

    createTriad() {
        this.triad1 = new EulerGeometry.Triad(15,0.1,4);
        this.scene.add(this.triad1);

        this.triad2 = new EulerGeometry.Triad(15,0.1,3, 0xffffff);
        const rotX = JSHelpers.getRandom(-Math.PI, Math.PI);
        this.triad2.rotateX(rotX);
        this.triad2.updateMatrixWorld(true);
        this.scene.add(this.triad2);

        this.rotate(this.triad1, this.triad2);

        this.triad3 = new EulerGeometry.Triad(15,0.1,2, 0x000000);
        const rotY = JSHelpers.getRandom(-Math.PI/2, Math.PI/2);
        this.triad3.rotateX(rotX);
        this.triad3.updateMatrixWorld(true);
        this.triad3.rotateY(rotY);
        this.triad3.updateMatrixWorld(true);
        this.scene.add(this.triad3);

        this.rotate(this.triad2, this.triad3);
    }

    rotate(triad1, triad2) {
        const wedgeMaterialE1 = new THREE.MeshBasicMaterial({color: Triad.intFromColor(Triad.reds[triad1.colorIntensity])});
        wedgeMaterialE1.side = THREE.DoubleSide;
        const wedgeMaterialE2 = new THREE.MeshBasicMaterial({color: Triad.intFromColor(Triad.greens[triad1.colorIntensity])});
        wedgeMaterialE2.side = THREE.DoubleSide;
        const wedgeMaterialE3 = new THREE.MeshBasicMaterial({color: Triad.intFromColor(Triad.blues[triad1.colorIntensity])});
        wedgeMaterialE3.side = THREE.DoubleSide;

        const {axis: axisE1, angle: angleE1} = EulerGeometry.axisAngleFromQuat(new THREE.Quaternion().setFromUnitVectors(triad1.arrowAxis(0), triad2.arrowAxis(0)));
        const wedgeGeometryE1 = new THREE.RingBufferGeometry(10, 11, 20, 20, 0, angleE1);
        const wedgeE1 = new THREE.Mesh(wedgeGeometryE1, wedgeMaterialE1);
        //x-axis of wedge is the starting "point"
        const wedgeE1_XAxis = triad1.arrowAxis(0);
        //z-axis of wedge is the rotAxis
        const wedgeE1_ZAxis = axisE1;
        //and the y-axis is created from the cross-product
        const wedgeE1_YAxis = new THREE.Vector3().crossVectors(wedgeE1_ZAxis, wedgeE1_XAxis);
        wedgeE1.setRotationFromMatrix(new THREE.Matrix4().makeBasis(wedgeE1_XAxis, wedgeE1_YAxis, wedgeE1_ZAxis));
        this.scene.add(wedgeE1);

        const {axis: axisE2, angle: angleE2} = EulerGeometry.axisAngleFromQuat(new THREE.Quaternion().setFromUnitVectors(triad1.arrowAxis(1), triad2.arrowAxis(1)));
        const wedgeGeometryE2 = new THREE.RingBufferGeometry(12, 13, 20, 20, 0, angleE2);
        const wedgeE2 = new THREE.Mesh(wedgeGeometryE2, wedgeMaterialE2);
        //x-axis of wedge is the starting "point"
        const wedgeE2_XAxis = triad1.arrowAxis(1);
        //z-axis of wedge is the rotAxis
        const wedgeE2_ZAxis = axisE2;
        //and the y-axis is created from the cross-product
        const wedgeE2_YAxis = new THREE.Vector3().crossVectors(wedgeE2_ZAxis, wedgeE2_XAxis);
        wedgeE2.setRotationFromMatrix(new THREE.Matrix4().makeBasis(wedgeE2_XAxis, wedgeE2_YAxis, wedgeE2_ZAxis));
        this.scene.add(wedgeE2);

        const {axis: axisE3, angle: angleE3} = EulerGeometry.axisAngleFromQuat(new THREE.Quaternion().setFromUnitVectors(triad1.arrowAxis(2), triad2.arrowAxis(2)));
        const wedgeGeometryE3 = new THREE.RingBufferGeometry(14, 15, 20, 20, 0, angleE3);
        const wedgeE3 = new THREE.Mesh(wedgeGeometryE3, wedgeMaterialE3);
        //x-axis of wedge is the starting "point"
        const wedgeE3_XAxis = triad1.arrowAxis(2);
        //z-axis of wedge is the rotAxis
        const wedgeE3_ZAxis = axisE3;
        //and the y-axis is created from the cross-product
        const wedgeE3_YAxis = new THREE.Vector3().crossVectors(wedgeE3_ZAxis, wedgeE3_XAxis);
        wedgeE3.setRotationFromMatrix(new THREE.Matrix4().makeBasis(wedgeE3_XAxis, wedgeE3_YAxis, wedgeE3_ZAxis));
        this.scene.add(wedgeE3);

        const quat1Quat2Rot = new THREE.Quaternion().multiplyQuaternions(triad2.quaternion, new THREE.Quaternion().copy(triad1.quaternion).conjugate());
        const {axis: rotAxis} = EulerGeometry.axisAngleFromQuat(quat1Quat2Rot);
        const points = [new THREE.Vector3().copy(rotAxis).multiplyScalar(-25), new THREE.Vector3().copy(rotAxis).multiplyScalar(25)];
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({color: 0xffffff});
        this.scene.add(new THREE.Line(lineGeometry, lineMaterial));
    }
}