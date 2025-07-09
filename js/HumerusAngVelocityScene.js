'use strict';

import {
    Scene, MeshPhongMaterial, Mesh, Color, AxesHelper, SphereBufferGeometry, MeshStandardMaterial, Matrix4,
    Line, LineBasicMaterial, BufferGeometry, PlaneBufferGeometry, LineSegments, EdgesGeometry,
    SpotLight, Vector3, Quaternion
} from "three";
import {divGeometry} from "./SceneHelpers.js"
import {TrackballControls} from "three/examples/jsm/controls/TrackballControls.js";
import {EulerScene} from "./EulerScene.js";
import {defaultCamera} from "./BaseView.js";
import {FatArrow, Triad} from "./EulerGeometry";

export class HumerusAngVelocityScene {
    static BONE_MATERIAL = new MeshPhongMaterial({color: EulerScene.BONE_COLOR});

    constructor(viewElement, renderer, humerusGeometry, humerusLength, arcStripWidth = 10, triadLength=150, markingStart=50) {
        this.viewElement = viewElement;
        this.renderer = renderer;
        this.triadLength = triadLength;
        this.arcStripWidth = arcStripWidth;
        this.markingsStart = markingStart;
        this.triadAspectRatio = 0.1;
        this.scene = new Scene();
        this.scene.background = new Color(EulerScene.SCENE_COLOR);
        this.humerusGeometry = humerusGeometry;
        this.humerusLength = humerusLength;
        this.humerus = new Mesh(this.humerusGeometry, HumerusAngVelocityScene.BONE_MATERIAL);
        this.initScene();
    }

    dispose() {
        this.xAxis.geometry.dispose();
        this.xAxis.material.dispose();
        this.yAxis.geometry.dispose();
        this.yAxis.material.dispose();
        this.zAxis.geometry.dispose();
        this.zAxis.material.dispose();
        if (this.controls) this.controls.dispose();
        this.scene.dispose();
    }

    initScene() {
        this.scene.add(this.humerus);
        this.createReferenceGeometry();
        this.angVelocityVector = new FatArrow(10, 150, 15, 10, 0x0000ff, [], 0, 0);
        this.scene.add(this.angVelocityVector);
        this.createSpotlight();
    }

    renderSceneGraph() {
        this.spotlight.position.addVectors(this.camera.position, new Vector3().setFromMatrixColumn(this.camera.matrixWorld, 2).multiplyScalar(10));
        this.renderer.render(this.scene, this.camera);
    }

    get viewGeometry() {
        return divGeometry(this.viewElement);
    }

    updateCamera() {
        const {aspectRatio} = this.viewGeometry;
        this.camera.aspect = aspectRatio;
        this.camera.updateProjectionMatrix();
    }

    createReferenceGeometry() {
        this.referenceTriad = new Triad(this.triadLength, this.triadAspectRatio, 1, 0, this.markingsStart, this.arcStripWidth*3);
        this.scene.add(this.referenceTriad);

        const xAxis_mat = new LineBasicMaterial({color: 0xff0000});
        const xAxis_geo = new BufferGeometry().setFromPoints([new Vector3(-this.triadLength*2, 0, 0), new Vector3(this.triadLength*2, 0, 0)]);
        this.xAxis = new Line(xAxis_geo, xAxis_mat);
        this.scene.add(this.xAxis);

        const yAxis_mat = new LineBasicMaterial({color: 0x00ff00});
        const yAxis_geo = new BufferGeometry().setFromPoints([new Vector3(0, -this.triadLength*2, 0), new Vector3(0, this.triadLength*2, 0)]);
        this.yAxis = new Line(yAxis_geo, yAxis_mat);
        this.scene.add(this.yAxis);

        const zAxis_mat = new LineBasicMaterial({color: 0x0000ff});
        const zAxis_geo = new BufferGeometry().setFromPoints([new Vector3(0, 0, -this.triadLength*2), new Vector3(0, 0, this.triadLength*2)]);
        this.zAxis = new Line(zAxis_geo, zAxis_mat);
        this.scene.add(this.zAxis);
    }

    createCamera() {
        const {aspectRatio} = this.viewGeometry;
        this.camera = defaultCamera(aspectRatio);
        this.camera.position.set(-425, 200, 225);
        this.camera.updateProjectionMatrix();
    }

    createControls() {
        this.controls = new TrackballControls(this.camera, this.viewElement);
        EulerScene.setTrackballControls(this.controls);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    createSpotlight() {
        this.spotlight = new SpotLight(0xffffff, 1, 0, Math.PI / 4, 0, 1);
        this.scene.add(this.spotlight);
        this.spotlight.target.position.copy(new Vector3());
    }
}

