import {EulerScene} from "./EulerScene.js";
import * as THREE from './vendor/three.js/build/three.module.js';
import "./EulerScene_AngleVis.js";

export class EulerBoneScene extends EulerScene {
    static BONE_COLOR = 0xe3dac9;
    static BONE_MATERIAL = new THREE.MeshPhongMaterial({color: EulerBoneScene.BONE_COLOR, opacity: 0.9, transparent: true});
    static AXIAL_PLANE_MATERIAL = new THREE.MeshBasicMaterial({color: 0xffffff, side: THREE.DoubleSide, depthTest: false});
    static XLINE_MATERIAL = new THREE.MeshBasicMaterial({color: 0xff0000, side: THREE.DoubleSide, depthTest: false});
    static XLINE_MATERIAL_WIRE = new THREE.MeshBasicMaterial({color: 0xff0000, side: THREE.DoubleSide, depthTest: false, wireframe: true});

    constructor(viewElement, renderer, numFrames, camera, humerusGeometry, humerusLength) {
        super(viewElement, renderer, numFrames, camera, 10, 150, 50);
        this.humerusGeometry = humerusGeometry;
        this.humerusLength = humerusLength;
        this.step0Humerus = new THREE.Mesh(this.humerusGeometry, new THREE.MeshPhongMaterial({color: EulerBoneScene.BONE_COLOR, opacity: 0.5, transparent: true}));
        this.step0Triad.add(this.step0Humerus);
        this.priorStepHumeriVisible = false;
        this.PLANE_GEOMETRY = new THREE.CircleBufferGeometry(this.triadLength, 16);
        this.PLANE_GEOMETRY.rotateX(-Math.PI/2);
        this.THIN_LINE_GEOMETRY = new THREE.PlaneBufferGeometry(this.triadLength*this.triadAspectRatio*0.5, this.triadLength, 1, 5);
        this.THIN_LINE_GEOMETRY.rotateX(-Math.PI/2);
        this.THIN_LINE_GEOMETRY.translate(0, 0, this.triadLength/2);
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
        this.updateAxialRotationStep();
    }

    removeSteps() {
        super.removeSteps();
        this.scene.remove(this.noAxialGroup);
    }

    reset(rotations) {
        super.reset(rotations);
        this.dispatchEvent({type: 'reset'});
    }

    updateToFrame(frameNum) {
        super.updateToFrame(frameNum);
        this.updateAxialRotationFrame(frameNum);
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

    initAxialRotation() {
    }

    updateAxialRotationFrame(frameNum) {
    }

    updateAxialRotationStep() {
    }
}

Object.assign(EulerBoneScene.prototype, THREE.EventDispatcher.prototype);
