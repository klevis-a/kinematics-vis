'use strict';

import {Scene, Color, Quaternion, LineBasicMaterial, BufferGeometry, PlaneBufferGeometry, EdgesGeometry,
    Line, LineSegments, Vector3, HemisphereLight, SpotLight, EventDispatcher} from './vendor/three.js/build/three.module.js';
import {divGeometry} from "./SceneHelpers.js"
import {TrackballControls} from "./vendor/three.js/examples/jsm/controls/TrackballControls.js";
import {Triad} from "./EulerGeometry.js";
import {EulerStep} from "./EulerStep.js"
import {defaultCamera} from "./BaseView.js";


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

    constructor(viewElement, renderer, numFrames, camera, arcStripWidth = 10, triadLength=150, markingStart=50) {
        this.viewElement = viewElement;
        this.camera = camera;
        this.numFrames = numFrames;
        this.renderer = renderer;
        this.scene = new Scene();
        this.scene.background = new Color(EulerScene.SCENE_COLOR);
        this.arcHeightSegments = 1;
        this.arcStripWidth = arcStripWidth;
        this.triadLength = triadLength;
        this.triadAspectRatio = 0.1;
        this.markingsStart = markingStart;
        this.currentStep = 0;
        this.triadsArcsVisible = true;
        this.initScene();
    }

    dispose() {
        this.referenceTriad.dispose();
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
        if (this.controls) this.controls.dispose();
        this.scene.dispose();
    }

    initialize(rotations) {
        this.rotations = rotations;
        this.createSteps();
        this.dispatchEvent({type: 'init'});
        this.showTriadsArcs();
    }

    createSteps() {
        this.quaternions = [new Quaternion()];

        this.rotations.forEach(rotation => {
            const lastQuat = this.quaternions[this.quaternions.length-1];
            const currentQuatRot = new Quaternion().setFromAxisAngle(rotation.axis, rotation.angle);
            this.quaternions.push(currentQuatRot.multiply(lastQuat));
        });

        this.steps = this.rotations.map((rotation, idx) => {
            // the EulerStep stepNumber parameter is set to idx+1 (one-based indexing) because of how the colors and
            // markings are are created on EulerStep objects. However, the stepNumber attribute of an EulerStep is not used
            // otherwise
            const eulerStep = new EulerStep(this.quaternions[idx], rotation, this.numFrames, this.triadLength,
                this.triadAspectRatio, this.markingsStart, idx + 1, this.arcStripWidth, this.numFrames, this.arcHeightSegments);
            this.addStepToScene(eulerStep);
            return eulerStep;
        });
        this.dispatchEvent({type: 'createSteps'});
    }

    addStepToScene(step) {
        this.scene.add(step.triad);
        this.scene.add(step.rotAxis);
        step.arcs.forEach(arc => this.scene.add(arc));
    }

    goToStep(stepNum) {
        this.currentStep = stepNum;

        this.steps.forEach((step, idx) => {
           if (idx < stepNum) {
               step.activate();
               step.updateToFrame(step.numFrames);
           } else if (idx === stepNum) {
               step.activate();
               step.updateToFrame(0);
           } else {
               step.deactivate();
           }
        });

        this.dispatchEvent({type: 'stepChange'});
    }

    removeSteps() {
        this.steps.forEach(step => {
            // attached humerus does not need to be disposed because both the geometry and material are re-usable
            step.dispose();
            this.scene.remove(step.triad);
            this.scene.remove(step.rotAxis);
            step.arcs.forEach(arc => this.scene.remove(arc));
        });
        this.dispatchEvent({type: 'removeSteps'});
    }

    reset(rotations) {
        console.assert(this.rotations.length === rotations.length);
        this.rotations = rotations;
        this.removeSteps();
        this.createSteps();
        this.dispatchEvent({type: 'reset'});
        this.showTriadsArcs();
    }

    updateToFrame(frameNum) {
        this.steps[this.currentStep].updateToFrame(frameNum);
        this.dispatchEvent({type: 'frameChange', frameNum: frameNum});
    }

    showTriadsArcs() {
        this.steps.forEach(step => step.isSeen(this.triadsArcsVisible));
        this.referenceTriad.isSeen(this.triadsArcsVisible);
    }

    initScene() {
        this.createReferenceGeometry();
        this.createSpotlight();
    }

    renderSceneGraph() {
        this.spotlight.position.addVectors(this.camera.position, new Vector3().setFromMatrixColumn(this.camera.matrixWorld, 2).multiplyScalar(10));
        this.renderer.render(this.scene, this.camera);
    }

    get viewGeometry() {
        return divGeometry(this.viewElement);
    }

    updateCamera() {
        const {aspectRatio} = this.viewGeometry;
        this.camera.aspect = aspectRatio;
        this.camera.updateProjectionMatrix();
    }

    createReferenceGeometry() {
        this.referenceTriad = new Triad(this.triadLength, this.triadAspectRatio, 1, 0, this.markingsStart, this.arcStripWidth*3);
        this.scene.add(this.referenceTriad);

        const xAxis_mat = new LineBasicMaterial({color: 0xff0000});
        const xAxis_geo = new BufferGeometry().setFromPoints([new Vector3(-this.triadLength*2, 0, 0), new Vector3(this.triadLength*2, 0, 0)]);
        this.xAxis = new Line(xAxis_geo, xAxis_mat);
        this.scene.add(this.xAxis);

        const yAxis_mat = new LineBasicMaterial({color: 0x00ff00});
        const yAxis_geo = new BufferGeometry().setFromPoints([new Vector3(0, -this.triadLength*2, 0), new Vector3(0, this.triadLength*2, 0)]);
        this.yAxis = new Line(yAxis_geo, yAxis_mat);
        this.scene.add(this.yAxis);

        const zAxis_mat = new LineBasicMaterial({color: 0x0000ff});
        const zAxis_geo = new BufferGeometry().setFromPoints([new Vector3(0, 0, -this.triadLength*2), new Vector3(0, 0, this.triadLength*2)]);
        this.zAxis = new Line(zAxis_geo, zAxis_mat);
        this.scene.add(this.zAxis);

        const planeGeometry = new PlaneBufferGeometry(this.triadLength*2*2, this.triadLength*2*2);
        const planeEdgesGeometry = new EdgesGeometry(planeGeometry);
        this.xyPlane = new LineSegments(planeEdgesGeometry, zAxis_mat);
        this.xyPlane.visible = false;
        this.scene.add(this.xyPlane);

        this.xzPlane = new LineSegments(planeEdgesGeometry, yAxis_mat);
        this.xzPlane.lookAt(new Vector3(0, 1, 0));
        this.xzPlane.visible = false;
        this.scene.add(this.xzPlane);

        this.yzPlane = new LineSegments(planeEdgesGeometry, xAxis_mat);
        this.yzPlane.lookAt(new Vector3(1, 0, 0));
        this.yzPlane.visible = false;
        this.scene.add(this.yzPlane);
    }

    toggleBodyPlaneVisibility(flag) {
        this.xyPlane.visible = flag;
        this.xzPlane.visible = flag;
        this.yzPlane.visible = flag;
    }

    createCamera() {
        const {aspectRatio} = this.viewGeometry;
        this.camera = defaultCamera(aspectRatio);
    }

    createControls() {
        this.controls = new TrackballControls(this.camera, this.viewElement);
        EulerScene.setTrackballControls(this.controls);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    createHemisphereLight() {
        this.hemisphereLight = new HemisphereLight(
            0xffffff, // sky color
            0x000000, // ground color
            1.25, // intensity
        );
        this.scene.add(this.hemisphereLight);
    }

    createSpotlight() {
        this.spotlight = new SpotLight(0xffffff, 1, 0, Math.PI / 4, 0, 1);
        this.scene.add(this.spotlight);
        this.spotlight.target = this.referenceTriad.origin;
    }
}

Object.assign(EulerScene.prototype, EventDispatcher.prototype);
