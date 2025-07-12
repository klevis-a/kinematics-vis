'use strict';

import {
    Scene, MeshPhongMaterial, Mesh, Color, SphereBufferGeometry, MeshStandardMaterial,
    Line, LineBasicMaterial, BufferGeometry, PlaneBufferGeometry, LineSegments, EdgesGeometry,
    SpotLight, Vector3, Quaternion, CircleBufferGeometry, MeshBasicMaterial, DoubleSide
} from "three";
import {divGeometry} from "./SceneHelpers.js"
import {TrackballControls} from "three/examples/jsm/controls/TrackballControls.js";
import {EulerScene} from "./EulerScene.js";
import {defaultCamera} from "./BaseView.js";
import {FatArrow, Triad} from "./EulerGeometry.js";

export class AxialOrientationTrajectoryScene {
    static BONE_MATERIAL = new MeshPhongMaterial({color: EulerScene.BONE_COLOR});
    static AXIAL_PLANE_MATERIAL = new MeshBasicMaterial({color: 0xffffff, side: DoubleSide, depthTest: false, visible: true, opacity: 0.7, transparent: true});

    constructor(viewElement, renderer, humerusGeometry, humerusLength, arcStripWidth = 10, triadLength = 150, markingStart = 50) {
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
        this.humerus = new Mesh(this.humerusGeometry, AxialOrientationTrajectoryScene.BONE_MATERIAL);
        this.initScene();
    }

    dispose() {
        this.xAxis.geometry.dispose();
        this.xAxis.material.dispose();
        this.yAxis.geometry.dispose();
        this.yAxis.material.dispose();
        this.zAxis.geometry.dispose();
        this.zAxis.material.dispose();
        
        if (this.globe) {
            this.globe.geometry.dispose();
            this.globe.material.dispose();
        }
        
        if (this.axialPlane) {
            this.axialPlane.geometry.dispose();
            this.axialPlane.material.dispose();
        }
        
        if (this.humerusTriad) {
            this.humerusTriad.dispose();
        }
        
        if (this.angVelocityVector) {
            this.angVelocityVector.dispose();
        }
        
        if (this.controls) this.controls.dispose();
        this.scene.dispose();
    }

    initScene() {
        this.scene.add(this.humerus);
        this.createReferenceGeometry();
        this.createGlobe(new Vector3(0, 1, 0));
        this.createHumerusTriad();
        this.createAxialPlane();
        this.createAngularVelocityVector();
        this.createSpotlight();
    }

    createGlobe(northPole) {
        this.northPole = northPole;
        const sphereGeometry = new SphereBufferGeometry(this.humerusLength, 12, 12, 0, Math.PI, 0, Math.PI);
        const sphereGeometryEdges = new EdgesGeometry(sphereGeometry);
        this.sphereEdgesMaterial = new LineBasicMaterial({color: 0x000000});
        this.finalLatLongMaterial = new LineBasicMaterial({color: 0xffff00});
        this.sphere = new LineSegments(sphereGeometryEdges, this.sphereEdgesMaterial);
        this.scene.add(this.sphere);

        // the lines below are drawn at the equator - they can be useful but also add visual comlexity so I am removing them for now
        // const longitudeDeltaAngle = Math.PI/this.numLongitudeSegments;
        // for (let i=1; i<this.numLongitudeSegments; i++) {
        //     const points = [];
        //     points.push(new Vector3());
        //     points.push(new Vector3(Math.cos(i*longitudeDeltaAngle)*this.humerusLength, 0, Math.sin(i*longitudeDeltaAngle)*this.humerusLength));
        //     const lineGeometry = new BufferGeometry().setFromPoints(points);
        //     const line = new Line(lineGeometry, this.sphereEdgesMaterial);
        //     this.sphere.add(line);
        // }
    };

    createHumerusTriad() {
        // Create a triad that will be attached to the humerus
        // this.humerusTriad = new Triad(this.triadLength * 0.8, this.triadAspectRatio, 1, 0, this.markingsStart, this.arcStripWidth * 2);
        // this.humerus.add(this.humerusTriad);
    }

    createAxialPlane() {
        const AXIAL_PLANE_MATERIAL = new MeshBasicMaterial({color: 0xffffff, side: DoubleSide, depthTest: false, visible: false});
        const XLINE_MATERIAL = new MeshBasicMaterial({color: 0x0000ff, side: DoubleSide, depthTest: false});
        const XLINE_MATERIAL_BLACK = new MeshBasicMaterial({color: 0x000000, side: DoubleSide, depthTest: false});

        const PLANE_GEOMETRY = new CircleBufferGeometry(this.triadLength, 16);
        PLANE_GEOMETRY.rotateX(-Math.PI/2);
        const THIN_LINE_GEOMETRY = new PlaneBufferGeometry(this.triadLength*this.triadAspectRatio*0.75, this.triadLength, 1, 5);
        THIN_LINE_GEOMETRY.rotateX(-Math.PI/2);
        THIN_LINE_GEOMETRY.translate(0, 0, this.triadLength/2);

        this.axialPlaneHum = new Mesh(PLANE_GEOMETRY, AXIAL_PLANE_MATERIAL);
        this.axialPlaneHum.name = 'axialPlaneHum';
        this.axialPlaneHum.renderOrder = 2;
        this.axialPlaneHum.position.set(0, 0, 0);
        this.axialPlaneHum.translateY(-this.humerusLength);
        this.humerus.add(this.axialPlaneHum);

        this.xLineHum = new Mesh(THIN_LINE_GEOMETRY, XLINE_MATERIAL);
        this.xLineHum.name = 'xLineHum';
        this.xLineHum.renderOrder = 4;
        this.xLineHum.rotateY(Math.PI/2);
        this.axialPlaneHum.add(this.xLineHum);
    }

    createAngularVelocityVector() {
        // Create angular velocity vector similar to HumerusAngVelocityScene
        this.angVelocityVector = new FatArrow(10, 150, 15, 10, 0x0000ff, [], 0, 0);
        this.scene.add(this.angVelocityVector);
    }

    updateAngularVelocityVector(angularVelocity) {
        if (angularVelocity && this.angVelocityVector) {
            const normalizedAngVel = angularVelocity.clone().normalize();
            this.angVelocityVector.quaternion.copy(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), normalizedAngVel));
            this.angVelocityVector.visible = true;

            // Scale the arrow based on magnitude (optional)
            // const scale = Math.min(angVelMagnitude * 10, 3); // Adjust scaling as needed
            // this.angVelocityVector.scale.setScalar(scale);
        }
    }

    updateHumerusOrientation(quaternion) {
        if (quaternion && this.humerus) {
            this.humerus.quaternion.copy(quaternion);
        }
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
        this.referenceTriad = new Triad(this.triadLength, this.triadAspectRatio, 1, 0, this.markingsStart, this.arcStripWidth * 3);
        this.scene.add(this.referenceTriad);

        const xAxis_mat = new LineBasicMaterial({color: 0xff0000});
        const xAxis_geo = new BufferGeometry().setFromPoints([new Vector3(-this.triadLength * 2, 0, 0), new Vector3(this.triadLength * 2, 0, 0)]);
        this.xAxis = new Line(xAxis_geo, xAxis_mat);
        this.scene.add(this.xAxis);

        const yAxis_mat = new LineBasicMaterial({color: 0x00ff00});
        const yAxis_geo = new BufferGeometry().setFromPoints([new Vector3(0, -this.triadLength * 2, 0), new Vector3(0, this.triadLength * 2, 0)]);
        this.yAxis = new Line(yAxis_geo, yAxis_mat);
        this.scene.add(this.yAxis);

        const zAxis_mat = new LineBasicMaterial({color: 0x0000ff});
        const zAxis_geo = new BufferGeometry().setFromPoints([new Vector3(0, 0, -this.triadLength * 2), new Vector3(0, 0, this.triadLength * 2)]);
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

    // Toggle visibility of components
    toggleGlobeVisibility(visible) {
        if (this.globe) {
            this.globe.visible = visible;
        }
    }

    toggleAxialPlaneVisibility(visible) {
        if (this.axialPlane) {
            this.axialPlane.visible = visible;
        }
    }

    toggleHumerusTriadVisibility(visible) {
        if (this.humerusTriad) {
            this.humerusTriad.isSeen(visible);
        }
    }

    toggleAngularVelocityVisibility(visible) {
        if (this.angVelocityVector) {
            this.angVelocityVector.visible = visible;
        }
    }
}