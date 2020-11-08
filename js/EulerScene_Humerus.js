import {EulerScene} from "./EulerScene.js";
import * as THREE from "./vendor/three.js/build/three.module.js";

EulerScene.BONE_COLOR = 0xe3dac9;
EulerScene.BONE_MATERIAL = new THREE.MeshPhongMaterial({color: EulerScene.BONE_COLOR, opacity: 0.9, transparent: true});

EulerScene.prototype.addHumerus = function () {
    this.humerus = new THREE.Mesh(this.humerusGeometry, new THREE.MeshPhongMaterial({color: EulerScene.BONE_COLOR,
        opacity: 0.5, transparent: true}));
    this.humerus.quaternion.copy(this.quaternions[this.quaternions.length-1]);
    this.scene.add(this.humerus);
};

EulerScene.prototype.updateHumeriBasedOnStep = function () {
    this.stepHumeri.forEach((stepHumerus, idx) => {
        if (this.priorStepHumeriVisible) {
            stepHumerus.visible = true;
        }
        else {
            stepHumerus.visible = (idx + 1) === this.currentStep;
        }
    });
};

export function enableHumerus(boneScene, humerusGeometry, humerusLength) {
    boneScene.humerusGeometry = humerusGeometry;
    boneScene.humerusLength = humerusLength;
    boneScene.step0Humerus = new THREE.Mesh(boneScene.humerusGeometry, new THREE.MeshPhongMaterial({color: EulerScene.BONE_COLOR, opacity: 0.5, transparent: true}));
    boneScene.referenceTriad.add(boneScene.step0Humerus);
    boneScene.priorStepHumeriVisible = false;

    boneScene.addEventListener('init', function (event) {
        const scene = event.target;
        scene.addHumerus();
    });

    boneScene.addEventListener('stepChange', function (event) {
        const scene = event.target;
        scene.updateHumeriBasedOnStep();
    });

    boneScene.addEventListener('createSteps', function (event) {
        const scene = event.target;
        scene.stepHumeri = [];
        scene.steps.forEach(step => {
            const humerusMesh = new THREE.Mesh(this.humerusGeometry, EulerScene.BONE_MATERIAL);
            humerusMesh.renderOrder = 1;
            scene.stepHumeri.push(humerusMesh);
            step.triad.add(humerusMesh);
        });
    });

}
