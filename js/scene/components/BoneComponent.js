'use strict';

import {MeshPhongMaterial, Mesh} from "three";
import {SceneComponent} from "../SceneComponent.js";

export class BoneComponent extends SceneComponent {
    static BONE_COLOR = 0xe3dac9;
    static BONE_MATERIAL = new MeshPhongMaterial({color: BoneComponent.BONE_COLOR, opacity: 0.9, transparent: true});

    constructor(boneGeometry) {
        super('bone');
        this.boneGeometry = boneGeometry;
        this.priorStepBonesVisible = false;
        this.stepBones = [];
        this.bone = null;
        this.step0Bone = null;
    }

    onInitialize(scene) {
        this.createStep0Bone(scene);
        this.createMainBone(scene);
    }

    createStep0Bone(scene) {
        this.step0Bone = new Mesh(
            this.boneGeometry,
            new MeshPhongMaterial({color: BoneComponent.BONE_COLOR, opacity: 0.5, transparent: true})
        );
        if (scene.referenceTriad) {
            scene.referenceTriad.add(this.step0Bone);
        }
    }

    createMainBone(scene) {
        this.bone = new Mesh(
            this.boneGeometry,
            new MeshPhongMaterial({color: BoneComponent.BONE_COLOR, opacity: 0.5, transparent: true})
        );
        scene.scene.add(this.bone);
    }

    onReset(scene, data) {
        this.removeStepBones(scene);
        this.createStepBones(scene);
        this.updateBonePosition(scene, data);
    }

    createStepBones(scene) {
        this.stepBones = [];
        if (scene.steps) {
            scene.steps.forEach(step => {
                const boneMesh = new Mesh(this.boneGeometry, BoneComponent.BONE_MATERIAL);
                boneMesh.renderOrder = 1;
                this.stepBones.push(boneMesh);
                step.triad.add(boneMesh);
            });
        }
    }

    removeStepBones(scene) {
        this.stepBones.forEach(bone => {
            if (bone.parent) {
                bone.parent.remove(bone);
            }
        });
        this.stepBones = [];
    }

    updateBonePosition(scene, data) {
        if (this.bone && scene.quaternions && scene.quaternions.length > 0) {
            this.bone.quaternion.copy(scene.quaternions[scene.quaternions.length - 1]);
        }
    }

    onSetFrame(scene, frameNum) {
        this.updateBonesBasedOnStep(scene);
    }

    updateBonesBasedOnStep(scene) {
        this.stepBones.forEach((stepBone, idx) => {
            if (this.priorStepBonesVisible) {
                stepBone.visible = true;
            } else {
                stepBone.visible = idx === scene.currentStep;
            }
        });
    }

    setPriorStepBonesVisible(visible) {
        this.priorStepBonesVisible = visible;
    }

    updateMainBoneQuaternion(quaternion) {
        if (this.bone) {
            this.bone.quaternion.copy(quaternion);
        }
    }

    onDispose(scene) {
        this.removeStepBones(scene);
        
        if (this.bone) {
            this.bone.material.dispose();
            scene.scene.remove(this.bone);
        }
        
        if (this.step0Bone) {
            this.step0Bone.material.dispose();
            if (this.step0Bone.parent) {
                this.step0Bone.parent.remove(this.step0Bone);
            }
        }
        
        if (this.boneGeometry) {
            this.boneGeometry.dispose();
        }
    }
}