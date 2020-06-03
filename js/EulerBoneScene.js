import {EulerScene} from "./EulerScene.js";
import * as THREE from './vendor/three.js/build/three.module.js';

export class EulerBoneScene extends EulerScene {
    static BONE_COLOR = 0xe3dac9;
    static BONE_MATERIAL = new THREE.MeshPhongMaterial({color: EulerBoneScene.BONE_COLOR, opacity: 0.8, transparent: true});

    constructor(viewElement, renderer, numFrames, camera, stepQuats, humerusGeometry, landmarksInfo) {
        super(viewElement, renderer, numFrames, camera, stepQuats, 10, 150, 50);
        this.humerusGeometry = humerusGeometry;
        this.landmarksInfo = landmarksInfo;
        this.computeHumerusInBB();
        this.attachHumeriToTriads();
    }

    computeHumerusInBB() {
        const hhc = this.landmarksInfo.humerus.hhc;
        const le = this.landmarksInfo.humerus.le;
        const me = this.landmarksInfo.humerus.me;
        const y_axis = new THREE.Vector3().addVectors(me, le).multiplyScalar(0.5).multiplyScalar(-1).add(hhc);
        const x_axis = new THREE.Vector3().subVectors(me, le).cross(y_axis);
        const z_axis = new THREE.Vector3().crossVectors(x_axis, y_axis);
        x_axis.normalize();
        y_axis.normalize();
        z_axis.normalize();
        this.BB_T_H = new THREE.Matrix4().makeBasis(x_axis, y_axis, z_axis).setPosition(hhc);
        this.H_T_BB = new THREE.Matrix4().getInverse(this.BB_T_H);
    }

    attachHumeriToTriads() {
        this.step0Humerus = new THREE.Mesh(this.humerusGeometry, EulerBoneScene.BONE_MATERIAL);
        this.step0Triad.add(this.step0Humerus);
        this.step0Humerus.applyMatrix4(this.H_T_BB);
        this.stepHumeri = [];
        this.steps.forEach(step => {
            const humerusMesh = new THREE.Mesh(this.humerusGeometry, EulerBoneScene.BONE_MATERIAL);
            humerusMesh.applyMatrix4(this.H_T_BB);
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
}