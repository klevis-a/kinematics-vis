'use strict';

import * as THREE from './vendor/three.js/build/three.module.js';
import * as SceneHelpers from "./SceneHelpers.js"
import {TrackballControls} from "./vendor/three.js/examples/jsm/controls/TrackballControls.js";
import * as EulerGeometry from "./EulerGeometry.js";
import * as EulerStep from "./EulerStep.js"


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
        this.markingsStart = 5;
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
            const eulerStep = new EulerStep.EulerStep(quatStart, quat, this.numFrames, this.triadLength, this.triadAspectRatio, this.markingsStart, idx+1, this.arcStripWidth, this.numFrames, this.arcHeightSegments);
            this.addStepToScene(eulerStep);
            return eulerStep;
        }, this);
    }

    addStepToScene(step) {
        this.scene.add(step.triad);
        this.scene.add(step.rotAxis);
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
        this.createReferenceGeometry();
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

    createReferenceGeometry() {
        this.step0Triad = new EulerGeometry.Triad(this.triadLength, this.triadAspectRatio, 1, 0, this.markingsStart, this.arcStripWidth*3);
        this.scene.add(this.step0Triad);

        const xAxis_mat = new THREE.LineBasicMaterial({color: 0xff0000});
        const xAxis_geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-this.triadLength*1.25, 0, 0), new THREE.Vector3(this.triadLength*1.25, 0, 0)]);
        this.xAxis = new THREE.Line(xAxis_geo, xAxis_mat);
        this.scene.add(this.xAxis);

        const yAxis_mat = new THREE.LineBasicMaterial({color: 0x00ff00});
        const yAxis_geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -this.triadLength*1.25, 0), new THREE.Vector3(0, this.triadLength*1.25, 0)]);
        this.yAxis = new THREE.Line(yAxis_geo, yAxis_mat);
        this.scene.add(this.yAxis);

        const zAxis_mat = new THREE.LineBasicMaterial({color: 0x0000ff});
        const zAxis_geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -this.triadLength*1.25), new THREE.Vector3(0, 0, this.triadLength*1.25)]);
        this.zAxis = new THREE.Line(zAxis_geo, zAxis_mat);
        this.scene.add(this.zAxis);

        const planeGeometry = new THREE.PlaneBufferGeometry(this.triadLength*1.25*2, this.triadLength*1.25*2);
        const planeEdgesGeometry = new THREE.EdgesGeometry(planeGeometry);
        this.xyPlane = new THREE.LineSegments(planeEdgesGeometry, zAxis_mat);
        this.scene.add(this.xyPlane);

        this.xzPlane = new THREE.LineSegments(planeEdgesGeometry, yAxis_mat);
        this.xzPlane.lookAt(new THREE.Vector3(0, 1, 0));
        this.scene.add(this.xzPlane);

        this.yzPlane = new THREE.LineSegments(planeEdgesGeometry, xAxis_mat);
        this.yzPlane.lookAt(new THREE.Vector3(1, 0, 0));
        this.scene.add(this.yzPlane);
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
            1.25, // intensity
        );
        this.scene.add(this.hemisphereLight);
    }
}
