import {EulerScene} from "./EulerScene.js";
import * as THREE from './vendor/three.js/build/three.module.js';
import "./EulerSceneDecorators.js";

export class EulerBoneScene extends EulerScene {
    static BONE_COLOR = 0xe3dac9;
    static BONE_MATERIAL = new THREE.MeshPhongMaterial({color: EulerBoneScene.BONE_COLOR, opacity: 0.9, transparent: true});
    static AXIAL_PLANE_MATERIAL = new THREE.MeshBasicMaterial({color: 0xffffff, side: THREE.DoubleSide, depthTest: false});
    static XLINE_MATERIAL = new THREE.MeshBasicMaterial({color: 0xff0000, side: THREE.DoubleSide, depthTest: false});
    static XLINE_MATERIAL_WIRE = new THREE.MeshBasicMaterial({color: 0xff0000, side: THREE.DoubleSide, depthTest: false, wireframe: true});

    constructor(viewElement, renderer, numFrames, camera, rotations, humerusGeometry, humerusLength) {
        super(viewElement, renderer, numFrames, camera, rotations, 10, 150, 50);
        this.numLatitudeSegments = 20;
        this.numLongitudeSegments = 10;
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
        this.addHumerus();
        this.attachHumeriToTriads();
        this.updateHumerisBasedOnStep();
        this.addSphere();
        this.addFinalLatitudeLongitude();
    }

    attachHumeriToTriads() {
        this.stepHumeri = [];
        this.steps.forEach(step => {
            const humerusMesh = new THREE.Mesh(this.humerusGeometry, EulerBoneScene.BONE_MATERIAL);
            humerusMesh.renderOrder = 1;
            this.stepHumeri.push(humerusMesh);
            step.triad.add(humerusMesh);
        }, this);
    }

    removeSteps() {
        this.steps.forEach(step => {
            step.dispose();
            this.scene.remove(step.triad);
            this.scene.remove(step.rotAxis);
            step.arcs.forEach(arc => this.scene.remove(arc), this);
        }, this);
        this.scene.remove(this.noAxialGroup);
    }

    addHumerus() {
        this.humerus = new THREE.Mesh(this.humerusGeometry, new THREE.MeshPhongMaterial({color: EulerBoneScene.BONE_COLOR, opacity: 0.5, transparent: true}));
        this.humerus.quaternion.copy(this.quaternions[this.quaternions.length-1]);
        this.scene.add(this.humerus);
    }

    goToStep(stepNum) {
        super.goToStep(stepNum);
        if (this.stepHumeri != null) {
            this.updateHumerisBasedOnStep();
            this.updateAxialRotationStep();
        }
    }

    updateToFrame(frameNum) {
        super.updateToFrame(frameNum);
        this.updateAxialRotationFrame(frameNum);
    }

    initAxialRotation() {
    }

    updateAxialRotationFrame(frameNum) {
    }

    updateAxialRotationStep() {
    }

    updateHumerisBasedOnStep() {
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