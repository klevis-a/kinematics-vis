import {EulerScene} from "./EulerScene.js";
import * as THREE from './vendor/three.js/build/three.module.js';

export class EulerBoneScene extends EulerScene {
    static BONE_COLOR = 0xe3dac9;
    static BONE_MATERIAL = new THREE.MeshPhongMaterial({color: EulerBoneScene.BONE_COLOR, opacity: 0.8, transparent: true});

    constructor(viewElement, renderer, numFrames, camera, rotations, humerusGeometry) {
        super(viewElement, renderer, numFrames, camera, rotations, 10, 150, 50);
        this.humerusGeometry = humerusGeometry;
        this.addHumerus();
        this.attachHumeriToTriads();
    }

    attachHumeriToTriads() {
        this.step0Humerus = new THREE.Mesh(this.humerusGeometry, EulerBoneScene.BONE_MATERIAL);
        this.step0Triad.add(this.step0Humerus);
        this.stepHumeri = [];
        this.steps.forEach(step => {
            const humerusMesh = new THREE.Mesh(this.humerusGeometry, EulerBoneScene.BONE_MATERIAL);
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
        }, this)
    }

    addHumerus() {
        this.humerus = new THREE.Mesh(this.humerusGeometry, EulerBoneScene.BONE_MATERIAL);
        this.humerus.quaternion.copy(this.quaternions[this.quaternions.length-1]);
        this.scene.add(this.humerus);
    }
}