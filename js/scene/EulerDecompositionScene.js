'use strict';

import {Quaternion, LineBasicMaterial, BufferGeometry, PlaneBufferGeometry, EdgesGeometry,
    Line, LineSegments, Vector3, HemisphereLight, SpotLight} from 'three';
import {BaseScene} from "./BaseScene.js";
import {Triad} from "../EulerGeometry.js";
import {EulerStep} from "../EulerStep.js";

export class EulerDecompositionScene extends BaseScene {
    constructor(viewElement, renderer, camera, numFrames, arcStripWidth = 10, triadLength = 150, markingStart = 50) {
        super(viewElement, renderer, camera);
        this.numFrames = numFrames;
        this.arcStripWidth = arcStripWidth;
        this.triadLength = triadLength;
        this.triadAspectRatio = 0.1;
        this.markingsStart = markingStart;
        this.currentStep = 0;
        this.triadsArcsVisible = true;
        this.startingQuat = new Quaternion();
        this.rotations = [];
        this.quaternions = [];
        this.steps = [];
    }

    initializeCore() {
        this.createReferenceGeometry();
        this.createLighting();
    }

    async reset(data) {
        if (data.rotations) {
            this.rotations = data.rotations;
            this.removeSteps();
            this.createSteps();
            this.showTriadsArcs();
        }
        await super.reset(data);
    }

    createSteps() {
        this.quaternions = [this.startingQuat];

        this.rotations.forEach(rotation => {
            const lastQuat = this.quaternions[this.quaternions.length - 1];
            const currentQuatRot = new Quaternion().setFromAxisAngle(rotation.axis, rotation.angle);
            this.quaternions.push(currentQuatRot.multiply(lastQuat));
        });

        this.steps = this.rotations.map((rotation, idx) => {
            const eulerStep = new EulerStep(
                this.quaternions[idx],
                rotation,
                this.numFrames,
                this.triadLength,
                this.triadAspectRatio,
                this.markingsStart,
                idx + 1,
                this.arcStripWidth,
                this.numFrames,
                1 // arcHeightSegments
            );
            this.addStepToScene(eulerStep);
            return eulerStep;
        });
    }

    addStepToScene(step) {
        this.scene.add(step.triad);
        this.scene.add(step.rotAxis);
        step.arcs.forEach(arc => this.scene.add(arc));
    }

    removeSteps() {
        this.steps.forEach(step => {
            step.dispose();
            this.scene.remove(step.triad);
            this.scene.remove(step.rotAxis);
            step.arcs.forEach(arc => this.scene.remove(arc));
        });
        this.steps = [];
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
            step.triad.updateMatrixWorld();
        });

        this.dispatchEvent({type: 'stepChanged', stepNum});
    }

    updateToFrame(frameNum) {
        if (this.steps[this.currentStep]) {
            this.steps[this.currentStep].updateToFrame(frameNum);
        }
    }

    showTriadsArcs() {
        this.steps.forEach(step => step.isSeen(this.triadsArcsVisible));
        if (this.referenceTriad) {
            this.referenceTriad.isSeen(this.triadsArcsVisible);
        }
    }

    createReferenceGeometry() {
        this.referenceTriad = new Triad(this.triadLength, this.triadAspectRatio, 1, 0, this.markingsStart, this.arcStripWidth * 3);
        this.scene.add(this.referenceTriad);

        this.createAxes();
        this.createPlanes();
    }

    createAxes() {
        const xAxis_mat = new LineBasicMaterial({color: 0xff0000});
        const xAxis_geo = new BufferGeometry().setFromPoints([
            new Vector3(-this.triadLength * 2, 0, 0),
            new Vector3(this.triadLength * 2, 0, 0)
        ]);
        this.xAxis = new Line(xAxis_geo, xAxis_mat);
        this.scene.add(this.xAxis);

        const yAxis_mat = new LineBasicMaterial({color: 0x00ff00});
        const yAxis_geo = new BufferGeometry().setFromPoints([
            new Vector3(0, -this.triadLength * 2, 0),
            new Vector3(0, this.triadLength * 2, 0)
        ]);
        this.yAxis = new Line(yAxis_geo, yAxis_mat);
        this.scene.add(this.yAxis);

        const zAxis_mat = new LineBasicMaterial({color: 0x0000ff});
        const zAxis_geo = new BufferGeometry().setFromPoints([
            new Vector3(0, 0, -this.triadLength * 2),
            new Vector3(0, 0, this.triadLength * 2)
        ]);
        this.zAxis = new Line(zAxis_geo, zAxis_mat);
        this.scene.add(this.zAxis);
    }

    createPlanes() {
        const planeGeometry = new PlaneBufferGeometry(this.triadLength * 4, this.triadLength * 4);
        const planeEdgesGeometry = new EdgesGeometry(planeGeometry);

        this.xyPlane = new LineSegments(planeEdgesGeometry, this.zAxis.material);
        this.xyPlane.visible = false;
        this.scene.add(this.xyPlane);

        this.xzPlane = new LineSegments(planeEdgesGeometry, this.yAxis.material);
        this.xzPlane.lookAt(new Vector3(0, 1, 0));
        this.xzPlane.visible = false;
        this.scene.add(this.xzPlane);

        this.yzPlane = new LineSegments(planeEdgesGeometry, this.xAxis.material);
        this.yzPlane.lookAt(new Vector3(1, 0, 0));
        this.yzPlane.visible = false;
        this.scene.add(this.yzPlane);
    }

    toggleBodyPlaneVisibility(flag) {
        this.xyPlane.visible = flag;
        this.xzPlane.visible = flag;
        this.yzPlane.visible = flag;
    }

    createLighting() {
        this.createHemisphereLight();
        this.createSpotlight();
    }

    createHemisphereLight() {
        this.hemisphereLight = new HemisphereLight(0xffffff, 0x000000, 1.25);
        this.scene.add(this.hemisphereLight);
    }

    createSpotlight() {
        this.spotlight = new SpotLight(0xffffff, 1, 0, Math.PI / 4, 0, 1);
        this.scene.add(this.spotlight);
        this.spotlight.target = this.referenceTriad.origin;
    }

    renderSceneGraph() {
        if (this.spotlight) {
            this.spotlight.position.addVectors(
                this.camera.position,
                new Vector3().setFromMatrixColumn(this.camera.matrixWorld, 2).multiplyScalar(10)
            );
        }
        super.renderSceneGraph();
    }

    dispose() {
        this.removeSteps();
        
        if (this.referenceTriad) {
            this.referenceTriad.dispose();
        }
        
        [this.xAxis, this.yAxis, this.zAxis].forEach(axis => {
            if (axis) {
                axis.geometry.dispose();
                axis.material.dispose();
            }
        });
        
        if (this.xyPlane) {
            this.xyPlane.geometry.dispose();
        }
        
        super.dispose();
    }
}