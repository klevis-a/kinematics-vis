'use strict';

import {SphereGeometry, MeshBasicMaterial, Mesh, Vector3} from "three";
import {SceneComponent} from "../SceneComponent.js";

export class SphereComponent extends SceneComponent {
    constructor(radius = 100, widthSegments = 32, heightSegments = 16) {
        super('sphere');
        this.radius = radius;
        this.widthSegments = widthSegments;
        this.heightSegments = heightSegments;
        this.sphere = null;
        this.northPole = new Vector3(0, 1, 0);
        this.visible = false;
    }

    onInitialize(scene) {
        this.createSphere(scene);
    }

    createSphere(scene) {
        const sphereGeometry = new SphereGeometry(this.radius, this.widthSegments, this.heightSegments);
        const sphereMaterial = new MeshBasicMaterial({
            color: 0xffffff,
            opacity: 0.3,
            transparent: true,
            wireframe: true
        });
        
        this.sphere = new Mesh(sphereGeometry, sphereMaterial);
        this.sphere.visible = this.visible;
        scene.scene.add(this.sphere);
    }

    setVisible(visible) {
        this.visible = visible;
        if (this.sphere) {
            this.sphere.visible = visible;
        }
    }

    setNorthPole(northPole) {
        this.northPole.copy(northPole);
        this.updateSphereOrientation();
    }

    updateSphereOrientation() {
        if (this.sphere) {
            // Orient sphere based on north pole
            const defaultUp = new Vector3(0, 1, 0);
            if (!this.northPole.equals(defaultUp)) {
                this.sphere.quaternion.setFromUnitVectors(defaultUp, this.northPole);
            }
        }
    }

    onReset(scene, data) {
        this.updateSphereOrientation();
    }

    onSetFrame(scene, frameNum) {
        // Sphere typically doesn't change per frame, but can be overridden
    }

    onDispose(scene) {
        if (this.sphere) {
            this.sphere.geometry.dispose();
            this.sphere.material.dispose();
            scene.scene.remove(this.sphere);
        }
    }
}