import {EulerScene} from "./EulerScene.js";
import * as THREE from './vendor/three.js/build/three.module.js';
import "./EulerSceneDecorators.js";

export class EulerBoneScene extends EulerScene {
    static BONE_COLOR = 0xe3dac9;
    static BONE_MATERIAL = new THREE.MeshPhongMaterial({color: EulerBoneScene.BONE_COLOR, opacity: 0.9, transparent: true});
    static AXIAL_PLANE_MATERIAL = new THREE.MeshBasicMaterial({color: 0xffffff, side: THREE.DoubleSide, depthTest: false});
    static XLINE_MATERIAL = new THREE.MeshBasicMaterial({color: 0xff0000, side: THREE.DoubleSide, depthTest: false});
    static ZLINE_MATERIAL = new THREE.MeshBasicMaterial({color: 0x0000ff, side: THREE.DoubleSide, depthTest: false});
    static XLINE_MATERIAL_WIRE = new THREE.MeshBasicMaterial({color: 0xff0000, side: THREE.DoubleSide, depthTest: false, wireframe: true});
    static ZLINE_MATERIAL_WIRE = new THREE.MeshBasicMaterial({color: 0x0000ff, side: THREE.DoubleSide, depthTest: false, wireframe: true});

    constructor(viewElement, renderer, numFrames, camera, rotations, humerusGeometry, humerusLength) {
        super(viewElement, renderer, numFrames, camera, rotations, 10, 150, 50);
        this.numLatitudeSegments = 20;
        this.numLongitudeSegments = 10;
        this.humerusGeometry = humerusGeometry;
        this.humerusLength = humerusLength;
        this.step0Humerus = new THREE.Mesh(this.humerusGeometry, new THREE.MeshPhongMaterial({color: EulerBoneScene.BONE_COLOR, opacity: 0.5, transparent: true}));
        this.step0Triad.add(this.step0Humerus);
        this.priorStepHumeriVisible = false;
        this.PLANE_GEOMETRY = new THREE.CircleBufferGeometry(this.triadLength, 16);
        this.PLANE_GEOMETRY.rotateX(-Math.PI/2);
        this.THIN_LINE_GEOMETRY = new THREE.PlaneBufferGeometry(this.triadLength*this.triadAspectRatio*0.5, this.triadLength, 1, 5);
        this.THIN_LINE_GEOMETRY.rotateX(-Math.PI/2);
        this.THIN_LINE_GEOMETRY.translate(0, 0, this.triadLength/2);
        this.addHumerus();
        this.attachHumeriToTriads();
        this.attachAxialPlanesToHumeri();
        this.updateHumerisBasedOnStep();
        this.addSphere();
        this.addFinalLatitudeLongitude();
    }

    attachHumeriToTriads() {
        this.stepHumeri = [];
        this.steps.forEach(step => {
            const humerusMesh = new THREE.Mesh(this.humerusGeometry, EulerBoneScene.BONE_MATERIAL);
            humerusMesh.renderOrder = 1;
            this.stepHumeri.push(humerusMesh);
            step.triad.add(humerusMesh);
        }, this);
    }

    removeSteps() {
        this.steps.forEach(step => {
            step.dispose();
            this.scene.remove(step.triad);
            this.scene.remove(step.rotAxis);
            step.arcs.forEach(arc => this.scene.remove(arc), this);
        }, this);
        this.scene.remove(this.axialGroup);
    }

    addHumerus() {
        this.humerus = new THREE.Mesh(this.humerusGeometry, new THREE.MeshPhongMaterial({color: EulerBoneScene.BONE_COLOR, opacity: 0.5, transparent: true}));
        this.humerus.quaternion.copy(this.quaternions[this.quaternions.length-1]);
        this.scene.add(this.humerus);
    }

    goToStep(stepNum) {
        super.goToStep(stepNum);
        if (this.stepHumeri != null) {
            this.updateHumerisBasedOnStep();
            this.updateNoAxialRotationGroup();
        }
    }

    updateToFrame(frameNum) {
        super.updateToFrame(frameNum);
        this.updateNoAxialRotationGroup();
    }

    attachAxialPlanesToHumeri() {
        this.stepHumeri.forEach(humerus => {
            //this is the axial plane that simply goes along with the the humerus
            const axialPlane = new THREE.Mesh(this.PLANE_GEOMETRY, EulerBoneScene.AXIAL_PLANE_MATERIAL);
            axialPlane.renderOrder = 2;
            axialPlane.position.set(0, 0, 0);
            axialPlane.translateY(-this.humerusLength);
            humerus.add(axialPlane);

            const xLine = new THREE.Mesh(this.THIN_LINE_GEOMETRY, EulerBoneScene.XLINE_MATERIAL);
            xLine.renderOrder = 3;
            xLine.rotateY(Math.PI/2);
            axialPlane.add(xLine);

            //const zLine = new THREE.Mesh(this.THIN_LINE_GEOMETRY, EulerBoneScene.ZLINE_MATERIAL);
            //zLine.renderOrder = 3;
            //axialPlane.add(zLine);
        });

        //this is the axial group that only moves with the humeral axis (i.e. no axial rotation)
        const xLine_noAxial = new THREE.Mesh(this.THIN_LINE_GEOMETRY, EulerBoneScene.XLINE_MATERIAL_WIRE);
        xLine_noAxial.renderOrder = 3;
        xLine_noAxial.rotateY(Math.PI/2);

        //const zLine_noAxial = new THREE.Mesh(this.THIN_LINE_GEOMETRY, EulerBoneScene.ZLINE_MATERIAL_WIRE);
        //zLine_noAxial.renderOrder = 3;

        this.axialGroup = new THREE.Group();
        this.axialGroup.add(xLine_noAxial);
        //this.axialGroup.add(zLine_noAxial);
        this.scene.add(this.axialGroup);
        this.updateNoAxialRotationGroup();
    }

    updateNoAxialRotationGroup() {
        this.steps[this.currentStep-1].triad.updateMatrixWorld();
        const currentHumeralAxis = this.steps[this.currentStep-1].triad.arrowAxis(1);
        this.axialGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), currentHumeralAxis);
        this.axialGroup.position.copy(new THREE.Vector3().copy(currentHumeralAxis).multiplyScalar(-this.humerusLength));
    }

    updateHumerisBasedOnStep() {
        this.stepHumeri.forEach((stepHumerus, idx) => {
            if (this.priorStepHumeriVisible) {
                stepHumerus.visible = true;
            }
            else {
                stepHumerus.visible = (idx + 1) === this.currentStep;
            }
        });
    }
}