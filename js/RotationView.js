'use strict';

import {
    CircleBufferGeometry,
    DoubleSide,
    Matrix4, Mesh,
    MeshBasicMaterial,
    PlaneBufferGeometry,
    Quaternion,
    Vector3
} from "three";
import {AnglesVisualizationSVD, Euler_xzy_angle_geometry, Euler_yxy_angle_geometry} from "./EulerAnglesGeometry.js";
import {EulerScene} from "./EulerScene.js";
import {EulerSceneSimultaneous} from "./EulerSceneSimultaneous.js";
import {enableBone} from "./EulerScene_Bone.js";
import {enableSphere} from "./EulerScene_Sphere.js";
import {enableAngleVis, updateAxialRotVis_Euler, updateAxialRotVis_SwingTwist, updateAxialRotVis_ShortestPath} from "./EulerScene_AngleVis.js";
import {enableAxialRot, AXIAL_ROT_METHODS} from "./EulerScene_Axial.js";
import {EulerSceneAnimationHelper} from "./EulerSceneAnimationHelper.js";
import {generateUUID} from "./JSHelpers.js";
import {BaseView} from "./BaseView.js";
import {HUMERUS_BASE} from "./RotationHelper.js";
import {enableSphereArea, update_area_vis_xzy, update_area_vis_yxy} from "./EulerScene_SphereAreaVis.js";
import {HumerusAngVelocityScene} from "./HumerusAngVelocityScene";
import {angularVelocity, AxisAngle, EulerDecomposition_RZ$$_RX$_RY} from "./RotDecompositions.js";
import {HumerusView} from "./HumerusView";


export class RotationView extends HumerusView {
    constructor(camera, renderer, rotationHelper, method_name, humerusGeometry, humerusLength, anglesVisLayer, areaVisLayer, humerusBase, numAnimFrames=100, framePeriod=10) {
        super(camera, renderer, rotationHelper, method_name, humerusGeometry, humerusLength, anglesVisLayer, areaVisLayer, humerusBase, numAnimFrames=100, framePeriod=10);
    }

    createEulerScene(){
        // this
        // this.exampleRotation1 = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 4);
        // this.exampleRotation2 = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), Math.PI / 4);
        // this.exampleRotation = new Quaternion().multiplyQuaternions(this.exampleRotation1, this.exampleRotation2);
        // this.decomp = [new AxisAngle(new Vector3(0, 0, 1), Math.PI / 4), new AxisAngle(new Vector3(1, 0, 0), Math.PI / 4)];
        // console.log(this.decomp)

        const temp = this.rotationHelper.twoRotations()
        this.exampleRotation = temp[0]
        this.decomp = temp[1]

        this.eulerScene = new EulerScene(this.scene_div, this.renderer, this.numAnimFrames, this.camera);
        this.eulerScene.humerusLength = this.humerusLength;
        enableBone(this.eulerScene, this.humerusGeometry);
        this.eulerScene.initialize(this.decomp);
        this.eulerScene.triadsArcsVisible = false;
        this.eulerScene.showTriadsArcs();
        this.eulerScene.steps.forEach(step => {
            step.rotAxis.isSeen(true);
        });
        this.eulerScene.goToStep(this.eulerScene.currentStep);
        this.createAxialPlane();
        this.animationHelper = new EulerSceneAnimationHelper(this.ctrlDiv, this.eulerScene, this.numAnimFrames, this.framePeriod);
    }

    createAxialPlane() {
        const AXIAL_PLANE_MATERIAL = new MeshBasicMaterial({color: 0xffffff, side: DoubleSide, depthTest: false, visible: false});
        const XLINE_MATERIAL = new MeshBasicMaterial({color: 0x0000ff, side: DoubleSide, depthTest: false});
        const XLINE_MATERIAL_BLACK = new MeshBasicMaterial({color: 0x000000, side: DoubleSide, depthTest: false});

        const PLANE_GEOMETRY = new CircleBufferGeometry(this.eulerScene.triadLength, 16);
        PLANE_GEOMETRY.rotateX(-Math.PI/2);
        const THIN_LINE_GEOMETRY = new PlaneBufferGeometry(this.eulerScene.triadLength*this.eulerScene.triadAspectRatio*0.75, this.eulerScene.triadLength, 1, 5);
        THIN_LINE_GEOMETRY.rotateX(-Math.PI/2);
        THIN_LINE_GEOMETRY.translate(0, 0, this.eulerScene.triadLength/2);

        this.axialPlaneHumFinal = new Mesh(PLANE_GEOMETRY, AXIAL_PLANE_MATERIAL);
        this.axialPlaneHumFinal.name = 'axialPlaneHumFinal';
        this.axialPlaneHumFinal.renderOrder = 2;
        this.axialPlaneHumFinal.position.set(0, 0, 0);
        this.axialPlaneHumFinal.translateY(-this.humerusLength);
        this.eulerScene.bone.add(this.axialPlaneHumFinal);

        this.xLineHumFinal = new Mesh(THIN_LINE_GEOMETRY, XLINE_MATERIAL);
        this.xLineHumFinal.name = 'xLineHumFinal';
        this.xLineHumFinal.renderOrder = 4;
        this.xLineHumFinal.rotateY(Math.PI/2);
        this.axialPlaneHumFinal.add(this.xLineHumFinal);
    }

    previewFrame(frameNum) {
    }

    setFrame(frameNum) {
    }
}
