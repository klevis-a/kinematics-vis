'use strict';

import * as THREE from './vendor/three.js/build/three.module.js';
import * as SceneHelpers from "./SceneHelpers.js"
import {TrackballControls} from "./vendor/three.js/examples/jsm/controls/TrackballControls.js";
import * as EulerGeometry from "./EulerGeometry.js";
import * as JSHelpers from "./JSHelpers.js"
import {Triad} from "./EulerGeometry.js";

export class EulerScene {

    static createArc(triad1, triad2, rotAxis, rotAngle, rotPlane, dim, stripBottomDistance, stripTopDistance, stripWidth, arcMaterial, radialSegments) {
        let coneAxis;
        let coneAngle;
        // it's easier to perform the calculations below if the unit vector we are rotating and the unit vector indicating
        // the axis or rotation point in the same general direction
        if (rotAxis.dot(triad1.arrowAxis(dim)) > 0) {
            coneAxis = new THREE.Vector3().copy(rotAxis);
            coneAngle = rotAngle;
        } else {
            coneAxis = new THREE.Vector3().copy(rotAxis).multiplyScalar(-1);
            coneAngle = -rotAngle;
        }
        const angleToRotAxis = triad1.arrowAxis(dim).angleTo(coneAxis);
        const radiusTop = stripTopDistance*Math.sin(angleToRotAxis);
        const radiusBottom = stripBottomDistance*Math.sin(angleToRotAxis);
        const height = stripWidth*Math.cos(angleToRotAxis);
        const arcGeometry = new THREE.CylinderBufferGeometry(radiusTop, radiusBottom, height, radialSegments, 1, true, 0, coneAngle);
        // the XZ plane bisects the created arc - we need to move it along the y-axis so it's placed properly
        arcGeometry.translate(0, (stripBottomDistance+stripWidth/2)*Math.cos(angleToRotAxis), 0);
        // we want the strip to appear during the animations so for now we don't draw anything
        arcGeometry.setDrawRange(0, 0);
        const arc = new THREE.Mesh(arcGeometry, arcMaterial);
        // the z-axis of the arc is its starting "point" - the arrow is projected onto the plane of the rotation because
        // this allows us to form a right-handed coordinate. Note that component perpendicular to the plane of the rotation
        // is not rotated (it can't be - it's parallel to the rotation axis). It's magnitude is account for in the radius
        // and geometry translation calculation
        const arc_ZAxis = rotPlane.projectPoint(triad1.arrowAxis(dim), new THREE.Vector3()).normalize();
        // the y-axis of arc is the rotAxis
        const arc_YAxis = coneAxis;
        // and the x-axis is created from the cross-product
        const arc_XAxis = new THREE.Vector3().crossVectors(arc_YAxis, arc_ZAxis);
        arc.setRotationFromMatrix(new THREE.Matrix4().makeBasis(arc_XAxis, arc_YAxis, arc_ZAxis));
        arc.updateMatrixWorld();
        return arc;
    }

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

    constructor(viewElement, canvasElement, numFrames) {
        this.viewElement = viewElement;
        this.canvasElement = canvasElement;
        this.numFrames = numFrames;
        this.renderer = new THREE.WebGLRenderer({canvas: canvasElement});
        this.renderer.shadowMap.enabled = true;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(EulerScene.SCENE_COLOR);
        this.initScene();
    }

    updateToFrame(frameNum) {
        const currentFrame = Math.floor(frameNum);
        if (currentFrame>=this.numFrames) {
            this.triad2.quaternion.copy(this.triad2_final.quaternion);
            this.arcE1.geometry.setDrawRange(0, this.numFrames*6);
            this.arcE2.geometry.setDrawRange(0, this.numFrames*6);
            this.arcE3.geometry.setDrawRange(0, this.numFrames*6);
        }
        else {
            const interpFactor = frameNum/this.numFrames;
            THREE.Quaternion.slerp(this.triad1.quaternion, this.triad2_final.quaternion, this.triad2.quaternion, interpFactor);
            const drawRange = interpFactor*this.numFrames*6;
            this.arcE1.geometry.setDrawRange(0, drawRange);
            this.arcE2.geometry.setDrawRange(0, drawRange);
            this.arcE3.geometry.setDrawRange(0, drawRange);
        }
    }

    initScene() {
        this.createCamera();
        this.createControls();
        this.createHemisphereLight();
        this.createTriads();
        this.createArcs(this.triad1, this.triad2_final);
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

    renderSceneGraph() {
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
        this.camera.position.set(0, 0, 30);
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
            1, // intensity
        );
        this.scene.add(this.hemisphereLight);
    }

    createTriads() {
        this.triad1 = new EulerGeometry.Triad(15,0.1,4);
        this.scene.add(this.triad1);

        this.triad2 = new EulerGeometry.Triad(15,0.1,3, 0xffffff);
        this.scene.add(this.triad2);

        //create the final triad for now - it's going to make computations easier but can likely remove it later
        const rotX = JSHelpers.getRandom(-Math.PI, Math.PI);
        const rotY = JSHelpers.getRandom(-Math.PI/2, Math.PI/2);
        const rotZ = JSHelpers.getRandom(-Math.PI, Math.PI);
        this.triad2_final = new EulerGeometry.Triad(15,0.1,3, 0xffffff);
        this.triad2_final.rotateX(rotX);
        this.triad2_final.updateMatrixWorld(true);
        this.triad2_final.rotateY(rotY);
        this.triad2_final.updateMatrixWorld(true);
        this.triad2_final.rotateZ(rotZ);
        this.triad2_final.updateMatrixWorld(true);
    }

    createArcs(triad1, triad2) {
        const quat1Quat2Rot = new THREE.Quaternion().multiplyQuaternions(triad2.quaternion, new THREE.Quaternion().copy(triad1.quaternion).conjugate());
        const {axis: rotAxis, angle: rotAngle} = EulerGeometry.axisAngleFromQuat(quat1Quat2Rot);
        const rotPlane = new THREE.Plane(rotAxis);

        const arcMaterialE1 = new THREE.MeshBasicMaterial({color: Triad.intFromColor(Triad.reds[triad1.colorIntensity])});
        arcMaterialE1.side = THREE.DoubleSide;
        const arcMaterialE2 = new THREE.MeshBasicMaterial({color: Triad.intFromColor(Triad.greens[triad1.colorIntensity])});
        arcMaterialE2.side = THREE.DoubleSide;
        const arcMaterialE3 = new THREE.MeshBasicMaterial({color: Triad.intFromColor(Triad.blues[triad1.colorIntensity])});
        arcMaterialE3.side = THREE.DoubleSide;

        this.arcE1 = EulerScene.createArc(triad1, triad2, rotAxis, rotAngle, rotPlane, 0, 10, 11, 1, arcMaterialE1, this.numFrames);
        this.arcE2 = EulerScene.createArc(triad1, triad2, rotAxis, rotAngle, rotPlane, 1, 12, 13, 1, arcMaterialE2, this.numFrames);
        this.arcE3 = EulerScene.createArc(triad1, triad2, rotAxis, rotAngle, rotPlane, 2, 14, 15, 1, arcMaterialE3, this.numFrames);

        this.scene.add(this.arcE1);
        this.scene.add(this.arcE2);
        this.scene.add(this.arcE3);
    }
}