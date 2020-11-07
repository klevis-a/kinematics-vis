import {EulerScene} from "./EulerScene.js";
import * as THREE from './vendor/three.js/build/three.module.js';
import "./EulerScene_AngleVis.js";

export class EulerBoneScene extends EulerScene {
    static BONE_COLOR = 0xe3dac9;
    static BONE_MATERIAL = new THREE.MeshPhongMaterial({color: EulerBoneScene.BONE_COLOR, opacity: 0.9, transparent: true});

    constructor(viewElement, renderer, numFrames, camera, humerusGeometry, humerusLength) {
        super(viewElement, renderer, numFrames, camera, 10, 150, 50);
        this.humerusGeometry = humerusGeometry;
        this.humerusLength = humerusLength;
        this.step0Humerus = new THREE.Mesh(this.humerusGeometry, new THREE.MeshPhongMaterial({color: EulerBoneScene.BONE_COLOR, opacity: 0.5, transparent: true}));
        this.step0Triad.add(this.step0Humerus);
        this.priorStepHumeriVisible = false;
    }

    addHumerus() {
        this.humerus = new THREE.Mesh(this.humerusGeometry, new THREE.MeshPhongMaterial({color: EulerBoneScene.BONE_COLOR,
            opacity: 0.5, transparent: true}));
        this.humerus.quaternion.copy(this.quaternions[this.quaternions.length-1]);
        this.scene.add(this.humerus);
    }

    initialize(rotations) {
        super.initialize(rotations);
        this.addHumerus();
        this.dispatchEvent({type: 'init'});
    }

    createSteps() {
        super.createSteps();

        this.stepHumeri = [];
        this.steps.forEach(step => {
            const humerusMesh = new THREE.Mesh(this.humerusGeometry, EulerBoneScene.BONE_MATERIAL);
            humerusMesh.renderOrder = 1;
            this.stepHumeri.push(humerusMesh);
            step.triad.add(humerusMesh);
        });
    }

    goToStep(stepNum) {
        super.goToStep(stepNum);
        this.updateHumeriBasedOnStep();
        this.dispatchEvent({type: 'stepChange'});
    }

    removeSteps() {
        super.removeSteps();
        this.dispatchEvent({type: 'removeSteps'});
    }

    reset(rotations) {
        super.reset(rotations);
        this.dispatchEvent({type: 'reset'});
    }

    updateToFrame(frameNum) {
        super.updateToFrame(frameNum);
        this.dispatchEvent({type: 'frameChange', frameNum: frameNum});
    }

    updateHumeriBasedOnStep() {
        this.stepHumeri.forEach((stepHumerus, idx) => {
            if (this.priorStepHumeriVisible) {
                stepHumerus.visible = true;
            }
            else {
                stepHumerus.visible = (idx + 1) === this.currentStep;
            }
        });
    }
}

Object.assign(EulerBoneScene.prototype, THREE.EventDispatcher.prototype);
