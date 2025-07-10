'use strict';

import {ConeBufferGeometry, MeshPhongMaterial, DoubleSide, Mesh, Vector3, Matrix4} from "three";
import {SceneComponent} from "../SceneComponent.js";

export class ConeComponent extends SceneComponent {
    constructor(humerusLength = 300) {
        super('cone');
        this.humerusLength = humerusLength;
        this.cone = null;
        this.visible = true;
    }

    onInitialize(scene) {
        // Cone will be created during reset when we have rotation data
    }

    onReset(scene, data) {
        this.removeCone(scene);
        this.createCone(scene, data);
    }

    createCone(scene, data) {
        if (!scene.bone || !scene.rotations || scene.rotations.length === 0) {
            return;
        }

        const currentQuat = scene.bone.quaternion;
        const currentMat = new Matrix4().makeRotationFromQuaternion(currentQuat);
        const longAxis = new Vector3();
        currentMat.extractBasis(new Vector3(), longAxis, new Vector3());

        // Get rotation axis and angle from the rotation
        const rotation = scene.rotations[0];
        const axis = rotation.axis;
        const angle = 2 * axis.angleTo(longAxis);

        // Create cone geometry
        const radius = this.humerusLength * Math.sin(angle / 2);
        const height = this.humerusLength * Math.cos(angle / 2);
        
        const coneGeometry = new ConeBufferGeometry(radius, height, 32, 2, true);
        coneGeometry.translate(0, -height / 2, 0);

        // Create transparent material for the cone
        const coneMaterial = new MeshPhongMaterial({
            color: 0x0088ff,
            transparent: true,
            opacity: 0.6,
            side: DoubleSide
        });

        // Create cone mesh
        this.cone = new Mesh(coneGeometry, coneMaterial);
        this.cone.visible = this.visible;

        // Position and orient the cone
        this.cone.position.set(0, 0, 0);
        this.cone.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), axis);

        scene.scene.add(this.cone);
    }

    removeCone(scene) {
        if (this.cone) {
            this.cone.geometry.dispose();
            this.cone.material.dispose();
            scene.scene.remove(this.cone);
            this.cone = null;
        }
    }

    setVisible(visible) {
        this.visible = visible;
        if (this.cone) {
            this.cone.visible = visible;
        }
    }

    onSetFrame(scene, frameNum) {
        // Cone typically doesn't change per frame
    }

    onDispose(scene) {
        this.removeCone(scene);
    }
}