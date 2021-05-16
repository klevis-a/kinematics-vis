'use strict';

import {EulerScene} from "./EulerScene.js";
import {MeshPhongMaterial, Mesh} from "./vendor/three.js/build/three.module.js";

EulerScene.BONE_COLOR = 0xe3dac9;
EulerScene.BONE_MATERIAL = new MeshPhongMaterial({color: EulerScene.BONE_COLOR, opacity: 0.9, transparent: true});

EulerScene.prototype.addBone = function () {
    this.bone = new Mesh(this.boneGeometry, new MeshPhongMaterial({color: EulerScene.BONE_COLOR,
        opacity: 0.5, transparent: true}));
    this.bone.quaternion.copy(this.quaternions[this.quaternions.length-1]);
    this.scene.add(this.bone);
};

EulerScene.prototype.updateBonesBasedOnStep = function () {
    this.stepBones.forEach((stepBone, idx) => {
        if (this.priorStepBonesVisible) {
            stepBone.visible = true;
        }
        else {
            stepBone.visible = idx === this.currentStep;
        }
    });
};

export function enableBone(boneScene, boneGeometry) {
    boneScene.boneGeometry = boneGeometry;
    boneScene.step0Bone = new Mesh(boneScene.boneGeometry, new MeshPhongMaterial({color: EulerScene.BONE_COLOR, opacity: 0.5, transparent: true}));
    boneScene.referenceTriad.add(boneScene.step0Bone);
    boneScene.priorStepBonesVisible = false;

    boneScene.addEventListener('init', function (event) {
        const scene = event.target;
        scene.addBone();
    });

    boneScene.addEventListener('stepChange', function (event) {
        const scene = event.target;
        scene.updateBonesBasedOnStep();
    });

    boneScene.addEventListener('createSteps', function (event) {
        const scene = event.target;
        scene.stepBones = [];
        scene.steps.forEach(step => {
            const boneMesh = new Mesh(this.boneGeometry, EulerScene.BONE_MATERIAL);
            boneMesh.renderOrder = 1;
            scene.stepBones.push(boneMesh);
            step.triad.add(boneMesh);
        });
    });

    boneScene.addEventListener('dispose', function (event) {
        const scene = event.target;
        disposeBones(scene);
    });
}

function disposeBones(boneScene) {
    boneScene.bone.material.dispose();
    boneScene.step0Bone.material.dispose();
    boneScene.boneGeometry.dispose();
}
