'use strict';

import {EulerScene} from "./EulerScene.js";
import {MeshPhongMaterial, Mesh, MeshBasicMaterial, DoubleSide, CircleBufferGeometry, PlaneBufferGeometry} from "three";

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

        const AXIAL_PLANE_MATERIAL = new MeshBasicMaterial({color: 0xffffff, side: DoubleSide, depthTest: false, visible: false});
        const XLINE_MATERIAL = new MeshBasicMaterial({color: 0x0000ff, side: DoubleSide, depthTest: false});
        const XLINE_MATERIAL_BLACK = new MeshBasicMaterial({color: 0x000000, side: DoubleSide, depthTest: false});

        const PLANE_GEOMETRY = new CircleBufferGeometry(scene.triadLength, 16);
        PLANE_GEOMETRY.rotateX(-Math.PI/2);
        const THIN_LINE_GEOMETRY = new PlaneBufferGeometry(scene.triadLength*scene.triadAspectRatio*0.75, scene.triadLength, 1, 5);
        THIN_LINE_GEOMETRY.rotateX(-Math.PI/2);
        THIN_LINE_GEOMETRY.translate(0, 0, scene.triadLength/2);


        scene.stepBones = [];
        scene.steps.forEach(step => {
            const boneMesh = new Mesh(this.boneGeometry, EulerScene.BONE_MATERIAL);
            boneMesh.renderOrder = 1;
            scene.stepBones.push(boneMesh);
            step.triad.add(boneMesh);

            const axialPlaneHum = new Mesh(PLANE_GEOMETRY, AXIAL_PLANE_MATERIAL);
            axialPlaneHum.name = 'axialPlaneHum';
            axialPlaneHum.renderOrder = 2;
            axialPlaneHum.position.set(0, 0, 0);
            axialPlaneHum.translateY(-this.humerusLength);
            boneMesh.add(axialPlaneHum);

            const xLineHum = new Mesh(THIN_LINE_GEOMETRY, XLINE_MATERIAL_BLACK);
            xLineHum.name = 'xLineHum';
            xLineHum.renderOrder = 4;
            xLineHum.rotateY(Math.PI/2);
            axialPlaneHum.add(xLineHum);
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
