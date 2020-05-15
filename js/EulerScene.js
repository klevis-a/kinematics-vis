'use strict';

import * as THREE from './vendor/three.js/build/three.module.js';
import * as SceneHelpers from "./SceneHelpers.js"
import {TrackballControls} from "./vendor/three.js/examples/jsm/controls/TrackballControls.js";
import {FatArrow} from "./EulerGeometry.js";

export class EulerScene {
    static setTrackballControls(trackBallControl) {
        trackBallControl.rotateSpeed = 3.0;
        trackBallControl.zoomSpeed = 1.2;
        trackBallControl.panSpeed = 0.8;
        //65:A - orbiting operations
        //83:S - zooming operations
        //68:D - panning operations
        trackBallControl.keys = [65, 83, 68];
    }

    static SCENE_COLOR =  0xDCDCDC;

    constructor(viewElement, canvasElement) {
        this.viewElement = viewElement;
        this.canvasElement = canvasElement;
        this.renderer = new THREE.WebGLRenderer({canvas: canvasElement});
        this.renderer.shadowMap.enabled = true;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(EulerScene.SCENE_COLOR);
        this.initScene();
    }

    initScene() {
        this.createCamera();
        this.createControls();
        this.createHemisphereLight();
        this.createArrow();
        //this.createBox();
    }

    resizeRendererToDisplaySize() {
        const width = this.canvasElement.clientWidth;
        const height = this.canvasElement.clientHeight;
        const needResize = this.renderer.width !== width || this.renderer.height !== height;
        if (needResize) {
            this.renderer.setSize(width, height, false);
        }
        return needResize;
    }

    renderScene() {
        this.resizeRendererToDisplaySize();
        this.camera.updateProjectionMatrix();
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    get viewGeometry() {
        return SceneHelpers.divGeometry(this.viewElement);
    }

    createCamera() {
        const {aspectRatio} = this.viewGeometry;
        const fov = 75;
        this.camera = new THREE.PerspectiveCamera(fov, aspectRatio, 0.1, 100);
        this.camera.position.set(0, 0, 10);
    }

    createControls() {
        this.controls = new TrackballControls(this.camera, this.viewElement);
        EulerScene.setTrackballControls(this.controls);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    createHemisphereLight() {
        this.hemisphereLight = new THREE.HemisphereLight(
            0xffffff, // sky color
            0x000000, // ground color
            0.65, // intensity
        );
        this.scene.add(this.hemisphereLight);
    }

    createArrow() {
        this.arrow = new FatArrow(3, 10, 6, 6, 0xff0000);
        this.scene.add(this.arrow);
    }
}