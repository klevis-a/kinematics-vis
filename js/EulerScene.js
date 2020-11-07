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

    constructor(viewElement, renderer, numFrames, camera, arcStripWidth = 1, triadLength=15, markingStart=5) {
        this.camera = camera;
        this.viewElement = viewElement;
        this.numFrames = numFrames;
        this.renderer = renderer;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(EulerScene.SCENE_COLOR);
        this.arcHeightSegments = 1;
        this.arcStripWidth = arcStripWidth;
        this.triadLength = triadLength;
        this.triadAspectRatio = 0.1;
        this.markingsStart = markingStart;
        this.currentStep = 1;
        this.initScene();
    }

    dispose() {
        this.step0Triad.dispose();
        this.xAxis.geometry.dispose();
        this.xAxis.material.dispose();
        this.yAxis.geometry.dispose();
        this.yAxis.material.dispose();
        this.zAxis.geometry.dispose();
        this.zAxis.material.dispose();
        // the geometry for the planes is the same so only dispose it for one of them
        // the material for the planes is inherited from the axes so no need to dispose them
        this.xyPlane.geometry.dispose();
        this.steps.forEach(step => step.dispose());
        this.scene.dispose();
    }

    initialize(rotations) {
        this.rotations = rotations;
        this.createSteps();
    }

    createSteps() {
        this.quaternions = [new THREE.Quaternion()];

        this.rotations.forEach(rotation => {
            const lastQuat = this.quaternions[this.quaternions.length-1];
            const currentQuatRot = new THREE.Quaternion().setFromAxisAngle(rotation.axis, rotation.angle);
            this.quaternions.push(currentQuatRot.multiply(lastQuat));
        });

        this.steps = this.rotations.map((rotation, idx) => {
            const eulerStep = new EulerStep.EulerStep(this.quaternions[idx], rotation, this.numFrames, this.triadLength,
                this.triadAspectRatio, this.markingsStart, idx+1, this.arcStripWidth, this.numFrames, this.arcHeightSegments);
            this.addStepToScene(eulerStep);
            return eulerStep;
        });
    }

    addStepToScene(step) {
        this.scene.add(step.triad);
        this.scene.add(step.rotAxis);
        step.arcs.forEach(arc => this.scene.add(arc));
    }

    goToStep(stepNum) {
        this.currentStep = stepNum;

        this.steps.forEach((step, idx) => {
           if (idx <= stepNum-2) {
               step.activate();
               step.updateToFrame(step.numFrames);
           } else if (idx === stepNum-1) {
               step.activate();
               step.updateToFrame(0);
           } else {
               step.deactivate();
           }
        });
    }

    removeSteps() {
        this.steps.forEach(step => {
            // attached humerus does not need to be disposed because both the geometry and material are re-usable
            step.dispose();
            this.scene.remove(step.triad);
            this.scene.remove(step.rotAxis);
            step.arcs.forEach(arc => this.scene.remove(arc));
        });
    }

    reset(rotations) {
        this.rotations = rotations;
        this.removeSteps();
        this.createSteps();
    }

    updateToFrame(frameNum) {
        this.steps[this.currentStep-1].updateToFrame(frameNum);
    }

    initScene() {
        if (this.camera == null) this.createCamera();
        this.createControls();
        this.createReferenceGeometry();
        this.createSpotlight();
    }

    renderSceneGraph() {
        this.spotlight.position.addVectors(this.camera.position, new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 2).multiplyScalar(10));
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
        const xAxis_geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-this.triadLength*2, 0, 0), new THREE.Vector3(this.triadLength*2, 0, 0)]);
        this.xAxis = new THREE.Line(xAxis_geo, xAxis_mat);
        this.scene.add(this.xAxis);

        const yAxis_mat = new THREE.LineBasicMaterial({color: 0x00ff00});
        const yAxis_geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -this.triadLength*2, 0), new THREE.Vector3(0, this.triadLength*2, 0)]);
        this.yAxis = new THREE.Line(yAxis_geo, yAxis_mat);
        this.scene.add(this.yAxis);

        const zAxis_mat = new THREE.LineBasicMaterial({color: 0x0000ff});
        const zAxis_geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -this.triadLength*2), new THREE.Vector3(0, 0, this.triadLength*2)]);
        this.zAxis = new THREE.Line(zAxis_geo, zAxis_mat);
        this.scene.add(this.zAxis);

        const planeGeometry = new THREE.PlaneBufferGeometry(this.triadLength*2*2, this.triadLength*2*2);
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

    createSpotlight() {
        this.spotlight = new THREE.SpotLight(0xffffff, 1, 0, Math.PI / 4, 0, 1);
        this.scene.add(this.spotlight);
        this.spotlight.target = this.step0Triad.origin;
    }
}
