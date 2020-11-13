'use strict';

import * as THREE from './vendor/three.js/build/three.module.js';
import * as SceneHelpers from "./SceneHelpers.js"
import {TrackballControls} from "./vendor/three.js/examples/jsm/controls/TrackballControls.js";
import {EulerScene} from "./EulerScene.js";

export class HumerusScapulaScene {
    static BONE_MATERIAL = new THREE.MeshPhongMaterial({color: EulerScene.BONE_COLOR});

    constructor(viewElement, renderer, humerusGeometry, scapulaGeometry, humerusLength, triadLength=150) {
        this.viewElement = viewElement;
        this.renderer = renderer;
        this.triadLength = triadLength;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(EulerScene.SCENE_COLOR);
        this.humerusGeometry = humerusGeometry;
        this.scapulaGeometry = scapulaGeometry;
        this.humerusLength = humerusLength;
        this.humerus = new THREE.Mesh(this.humerusGeometry, HumerusScapulaScene.BONE_MATERIAL);
        this.scapula = new THREE.Mesh(this.scapulaGeometry, HumerusScapulaScene.BONE_MATERIAL);
        this.initScene();
    }

    dispose() {
        this.xAxis.geometry.dispose();
        this.xAxis.material.dispose();
        this.yAxis.geometry.dispose();
        this.yAxis.material.dispose();
        this.zAxis.geometry.dispose();
        this.zAxis.material.dispose();
        // the geometry for the planes is the same so only dispose it for one of them
        // the material for the planes is inherited from the axes so no need to dispose them
        this.xyPlane.geometry.dispose();
    }

    initScene() {
        this.scene.add(this.humerus);
        this.scene.add(this.scapula);
        this.createReferenceGeometry();
        this.createSpotlight();
    }

    renderSceneGraph() {
        this.spotlight.position.addVectors(this.camera.position, new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 2).multiplyScalar(10));
        this.renderer.render(this.scene, this.camera);
    }

    get viewGeometry() {
        return SceneHelpers.divGeometry(this.viewElement);
    }

    updateCamera() {
        const {aspectRatio} = this.viewGeometry;
        this.camera.aspect = aspectRatio;
        this.camera.updateProjectionMatrix();
    }

    createReferenceGeometry() {
        const xAxis_mat = new THREE.LineBasicMaterial({color: 0xff0000});
        const xAxis_geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-this.triadLength*2, 0, 0), new THREE.Vector3(this.triadLength*2, 0, 0)]);
        this.xAxis = new THREE.Line(xAxis_geo, xAxis_mat);
        this.scene.add(this.xAxis);

        const yAxis_mat = new THREE.LineBasicMaterial({color: 0x00ff00});
        const yAxis_geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -this.triadLength*2, 0), new THREE.Vector3(0, this.triadLength*2, 0)]);
        this.yAxis = new THREE.Line(yAxis_geo, yAxis_mat);
        this.scene.add(this.yAxis);

        const zAxis_mat = new THREE.LineBasicMaterial({color: 0x0000ff});
        const zAxis_geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -this.triadLength*2), new THREE.Vector3(0, 0, this.triadLength*2)]);
        this.zAxis = new THREE.Line(zAxis_geo, zAxis_mat);
        this.scene.add(this.zAxis);

        const planeGeometry = new THREE.PlaneBufferGeometry(this.triadLength*2*2, this.triadLength*2*2);
        const planeEdgesGeometry = new THREE.EdgesGeometry(planeGeometry);
        this.xyPlane = new THREE.LineSegments(planeEdgesGeometry, zAxis_mat);
        this.xyPlane.visible = false;
        this.scene.add(this.xyPlane);

        this.xzPlane = new THREE.LineSegments(planeEdgesGeometry, yAxis_mat);
        this.xzPlane.lookAt(new THREE.Vector3(0, 1, 0));
        this.xzPlane.visible = false;
        this.scene.add(this.xzPlane);

        this.yzPlane = new THREE.LineSegments(planeEdgesGeometry, xAxis_mat);
        this.yzPlane.lookAt(new THREE.Vector3(1, 0, 0));
        this.yzPlane.visible = false;
        this.scene.add(this.yzPlane);
    }

    createCamera() {
        const {aspectRatio} = this.viewGeometry;
        const fov = 75;
        this.camera = new THREE.PerspectiveCamera(fov, aspectRatio, 1, 2000);
        this.camera.position.set(-500, 0, 0);
        this.camera.updateProjectionMatrix();
    }

    createControls() {
        this.controls = new TrackballControls(this.camera, this.viewElement);
        EulerScene.setTrackballControls(this.controls);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    createSpotlight() {
        this.spotlight = new THREE.SpotLight(0xffffff, 1, 0, Math.PI / 4, 0, 1);
        this.scene.add(this.spotlight);
        this.spotlight.target.position.copy(new THREE.Vector3());
    }
}
