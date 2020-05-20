'use strict';

import * as THREE from './vendor/three.js/build/three.module.js';
import * as SceneHelpers from "./SceneHelpers.js"
import {TrackballControls} from "./vendor/three.js/examples/jsm/controls/TrackballControls.js";
import * as EulerGeometry from "./EulerGeometry.js";
import * as JSHelpers from "./JSHelpers.js"
import {Triad} from "./EulerGeometry.js";

export class EulerScene {
    static createArc(triad1, triad2, rotAxis, rotAngle, rotPlane, dim, stripBottomDistance, stripTopDistance, stripWidth, arcMaterial, radialSegments, heightSegments) {
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
        const arcGeometry = new THREE.CylinderBufferGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments, true, 0, coneAngle);
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

    static arrowGeometryFromArcGeometry(arcGeometry, numRadialSegments, numHeightSegments, arrowSegmentLength) {
        const arcGeometryPositions = arcGeometry.attributes.position.array;
        const arrowGeometry = new THREE.Geometry();
        // these comprise the base of the triangle
        const v1 = new THREE.Vector3(arcGeometryPositions[0], arcGeometryPositions[1], arcGeometryPositions[2]);
        const topFirstIndex = ((numRadialSegments+1)*numHeightSegments);
        const v2 = new THREE.Vector3(arcGeometryPositions[topFirstIndex*3], arcGeometryPositions[topFirstIndex*3+1], arcGeometryPositions[topFirstIndex*3+2]);
        // now we compute the tip of the triangle
        const posBottom = new THREE.Vector3(arcGeometryPositions[arrowSegmentLength*3], arcGeometryPositions[arrowSegmentLength*3+1], arcGeometryPositions[arrowSegmentLength*3+2]);
        const posTop = new THREE.Vector3(arcGeometryPositions[(topFirstIndex+arrowSegmentLength)*3], arcGeometryPositions[(topFirstIndex+arrowSegmentLength)*3+1], arcGeometryPositions[(topFirstIndex+arrowSegmentLength)*3+2]);
        const v3 = new THREE.Vector3().addVectors(posBottom, posTop).multiplyScalar(0.5);

        //add vertices and normalize by v1
        arrowGeometry.vertices.push(new THREE.Vector3());
        arrowGeometry.vertices.push(v2.sub(v1));
        arrowGeometry.vertices.push(v3.sub(v1));

        arrowGeometry.faces.push(new THREE.Face3(0, 2, 1));

        //now we'll make it so the x-axis is defined by the, the y-axis points toward the tip, and the z-axis is perpendicular to the triangle plane
        const x_axis = new THREE.Vector3().copy(v2);
        const z_axis = new THREE.Vector3().crossVectors(v2, v3);
        const y_axis = new THREE.Vector3().crossVectors(z_axis, x_axis);
        //normalize
        x_axis.normalize();
        y_axis.normalize();
        z_axis.normalize();

        //rotation of triangle with respect to coordinate system
        arrowGeometry.applyMatrix4(new THREE.Matrix4().getInverse(new THREE.Matrix4().makeBasis(x_axis, y_axis, z_axis)));
        return arrowGeometry;
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

    static updateFlatArcArrow(arcArrow, arrowGeometry, drawRange, numRadialSegments, numHeightSegments, arrowSegmentLength) {
        const arcArrowV1Idx = arrowGeometry.index.array[drawRange - 1] - arrowSegmentLength;
        const arcPositions = arrowGeometry.attributes.position.array;
        const v1 = new THREE.Vector3().set(arcPositions[arcArrowV1Idx * 3], arcPositions[arcArrowV1Idx * 3 + 1], arcPositions[arcArrowV1Idx * 3 + 2]);
        arcArrow.position.copy(v1);

        //although it's not necessary to compute the midpoint for determining the orientation of the arrow we do so to mirror the geometry creation step
        const arcArrowV2Idx =  arrowGeometry.index.array[drawRange - 1] + ((numRadialSegments + 1) * numHeightSegments) - arrowSegmentLength;
        const arcE1ArrowV3TopIdx = arrowGeometry.index.array[drawRange - 1] + ((numRadialSegments + 1) * numHeightSegments);
        const arcE1ArrowV3BottomIdx = arrowGeometry.index.array[drawRange - 1];
        const v2 = new THREE.Vector3().set(arcPositions[arcArrowV2Idx * 3], arcPositions[arcArrowV2Idx * 3 + 1], arcPositions[arcArrowV2Idx * 3 + 2]);
        const v3Top = new THREE.Vector3().set(arcPositions[arcE1ArrowV3TopIdx * 3], arcPositions[arcE1ArrowV3TopIdx * 3 + 1], arcPositions[arcE1ArrowV3TopIdx * 3 + 2]);
        const v3Bottom = new THREE.Vector3().set(arcPositions[arcE1ArrowV3BottomIdx * 3], arcPositions[arcE1ArrowV3BottomIdx * 3 + 1], arcPositions[arcE1ArrowV3BottomIdx * 3 + 2]);
        const v3 = new THREE.Vector3().addVectors(v3Top, v3Bottom).multiplyScalar(0.5);
        //create CS and normalize
        const x_axis = new THREE.Vector3().subVectors(v2,v1);
        const z_axis = new THREE.Vector3().crossVectors(x_axis, new THREE.Vector3().subVectors(v3,v1));
        const y_axis = new THREE.Vector3().crossVectors(z_axis, x_axis);
        x_axis.normalize();
        y_axis.normalize();
        z_axis.normalize();
        arcArrow.setRotationFromMatrix(new THREE.Matrix4().makeBasis(x_axis, y_axis, z_axis));
    }

    static updateConeArcArrow(arcArrow, arcGeometry, drawRange, numRadialSegments, numHeightSegments) {
        /*
        v3----v2\\
        |      |  \\
        |      |   \\
        |      |  //
        v4----v1//
         */
        const v1Idx = arcGeometry.index.array[drawRange - 1];
        const v2Idx =  arcGeometry.index.array[drawRange - 1] + ((numRadialSegments + 1) * numHeightSegments);
        const v3Idx = v2Idx - 1;
        const v4Idx = v1Idx - 1;
        const arcPositions = arcGeometry.attributes.position.array;
        const v1 = new THREE.Vector3().set(arcPositions[v1Idx * 3], arcPositions[v1Idx * 3 + 1], arcPositions[v1Idx * 3 + 2]);
        const v2 = new THREE.Vector3().set(arcPositions[v2Idx * 3], arcPositions[v2Idx * 3 + 1], arcPositions[v2Idx * 3 + 2]);
        const v3 = new THREE.Vector3().set(arcPositions[v3Idx * 3], arcPositions[v3Idx * 3 + 1], arcPositions[v3Idx * 3 + 2]);
        const v4 = new THREE.Vector3().set(arcPositions[v4Idx * 3], arcPositions[v4Idx * 3 + 1], arcPositions[v4Idx * 3 + 2]);
        const v1v2_mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
        const v3v4_mid = new THREE.Vector3().addVectors(v3, v4).multiplyScalar(0.5);
        arcArrow.position.copy(v1v2_mid);
        const y_axis = new THREE.Vector3().subVectors(v1v2_mid, v3v4_mid);
        //the radial symmetry of a cone makes it so we don't have to really care which way the z and x axis face
        const x_axis = new THREE.Vector3().crossVectors(y_axis, new THREE.Vector3().subVectors(v1, v2));
        const z_axis = new THREE.Vector3().crossVectors(x_axis, y_axis);
        x_axis.normalize();
        y_axis.normalize();
        z_axis.normalize();
        arcArrow.setRotationFromMatrix(new THREE.Matrix4().makeBasis(x_axis, y_axis, z_axis));
    }

    static SCENE_COLOR =  0xDCDCDC;
    static NUM_INDICES_PER_RADIAL_SEGMENT = 6;

    constructor(viewElement, canvasElement, numFrames) {
        this.viewElement = viewElement;
        this.canvasElement = canvasElement;
        this.numFrames = numFrames;
        this.renderer = new THREE.WebGLRenderer({canvas: canvasElement});
        this.renderer.shadowMap.enabled = true;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(EulerScene.SCENE_COLOR);
        this.arcHeightSegments = 1;
        this.arrowSegmentLength = 4;
        this.stripWidth = 1;
        this.arcs = [];
        this.arcArrows = [];
        this.useConeArrows = true;
        this.triadLength = 15;
        this.triadAspectRatio = 0.1;
        this.initScene();
    }

    updateToFrame(frameNum) {
        this.updateTriad(frameNum);
        this.updateToFrameArcs(frameNum);
        // if (this.useConeArrows) {
        //     this.updateToFrameConeArrows(frameNum);
        // } else {
        //     this.updateToFrameFlatArrows(frameNum);
        // }
    }

    updateTriad(frameNum) {
        const currentFrame = Math.floor(frameNum);
        if (currentFrame>=this.numFrames) {
            this.triad2.quaternion.copy(this.triad2_final.quaternion);
        } else {
            const interpFactor = frameNum/this.numFrames;
            THREE.Quaternion.slerp(this.triad1.quaternion, this.triad2_final.quaternion, this.triad2.quaternion, interpFactor);
        }
    }

    updateToFrameFlatArrows(frameNum) {
        const currentFrame = Math.floor(frameNum);
        if (currentFrame>=this.numFrames) {
            const drawRange = this.numFrames*this.arcHeightSegments*EulerScene.NUM_INDICES_PER_RADIAL_SEGMENT;
            this.arcs.forEach(arc => arc.geometry.setDrawRange(0, drawRange));
            this.arcArrows.forEach((arcArrow, idx) => {
                EulerScene.updateFlatArcArrow(arcArrow, this.arcs[idx].geometry, drawRange, this.numFrames, this.arcHeightSegments, this.arrowSegmentLength);
                arcArrow.visible = true;
            });
        }
        else {
            const interpFactor = frameNum/this.numFrames;
            const drawRangeContinous = interpFactor*this.numFrames*this.arcHeightSegments*EulerScene.NUM_INDICES_PER_RADIAL_SEGMENT;
            //restrict drawRange to a complete segment
            const drawRange = drawRangeContinous - drawRangeContinous % (this.arcHeightSegments*EulerScene.NUM_INDICES_PER_RADIAL_SEGMENT);

            if (drawRange > 0) {
                this.arcs.forEach(arc => arc.geometry.setDrawRange(0, drawRange));
                if (drawRange >= this.arrowSegmentLength*this.arcHeightSegments*EulerScene.NUM_INDICES_PER_RADIAL_SEGMENT) {
                    this.arcArrows.forEach((arcArrow, idx) => {
                        EulerScene.updateFlatArcArrow(arcArrow, this.arcs[idx].geometry, drawRange, this.numFrames, this.arcHeightSegments, this.arrowSegmentLength);
                        arcArrow.visible = true;
                    });
                }
                else {
                    this.arcArrows.forEach(arcArrow => arcArrow.visible=false);
                }
            }
            else {
                this.arcs.forEach(arc => arc.geometry.setDrawRange(0, 0));
                this.arcArrows.forEach(arcArrow => arcArrow.visible=false);
            }
        }
    }

    updateToFrameArcs(frameNum) {
        const currentFrame = Math.floor(frameNum);
        if (currentFrame>=this.numFrames) {
            const drawRange = this.numFrames*this.arcHeightSegments*EulerScene.NUM_INDICES_PER_RADIAL_SEGMENT;
            this.arcs.forEach(arc => arc.geometry.setDrawRange(0, drawRange));
        }
        else {
            const interpFactor = frameNum/this.numFrames;
            const drawRangeContinous = interpFactor*this.numFrames*this.arcHeightSegments*EulerScene.NUM_INDICES_PER_RADIAL_SEGMENT;
            //restrict drawRange to a complete segment
            const drawRange = drawRangeContinous - drawRangeContinous % (this.arcHeightSegments*EulerScene.NUM_INDICES_PER_RADIAL_SEGMENT);

            if (drawRange > 0) {
                this.arcs.forEach(arc => arc.geometry.setDrawRange(0, drawRange));
            }
            else {
                this.arcs.forEach(arc => arc.geometry.setDrawRange(0, 0));
            }
        }
    }

    updateToFrameConeArrows(frameNum) {
        const currentFrame = Math.floor(frameNum);
        if (currentFrame>=this.numFrames) {
            const drawRange = this.numFrames*this.arcHeightSegments*EulerScene.NUM_INDICES_PER_RADIAL_SEGMENT;
            this.arcs.forEach(arc => arc.geometry.setDrawRange(0, drawRange));
            this.arcArrows.forEach((arcArrow, idx) => {
                EulerScene.updateConeArcArrow(arcArrow, this.arcs[idx].geometry, drawRange, this.numFrames, this.arcHeightSegments);
                arcArrow.visible = true;
            });
        }
        else {
            const interpFactor = frameNum/this.numFrames;
            const drawRangeContinous = interpFactor*this.numFrames*this.arcHeightSegments*EulerScene.NUM_INDICES_PER_RADIAL_SEGMENT;
            //restrict drawRange to a complete segment
            const drawRange = drawRangeContinous - drawRangeContinous % (this.arcHeightSegments*EulerScene.NUM_INDICES_PER_RADIAL_SEGMENT);

            if (drawRange > 0) {
                this.arcs.forEach(arc => arc.geometry.setDrawRange(0, drawRange));
                this.arcArrows.forEach((arcArrow, idx) => {
                    EulerScene.updateConeArcArrow(arcArrow, this.arcs[idx].geometry, drawRange, this.numFrames, this.arcHeightSegments);
                    arcArrow.visible = true;
                });
            }
            else {
                this.arcs.forEach(arc => arc.geometry.setDrawRange(0, 0));
                this.arcArrows.forEach(arcArrow => arcArrow.visible=false);
            }
        }
    }

    initScene() {
        this.createCamera();
        this.createControls();
        this.createHemisphereLight();
        this.createTriads();
        this.createArcs(this.triad1, this.triad2_final);
        if (this.useConeArrows) {
            this.createCylinderArcArrows();
        } else {
            this.createArcArrows();
        }
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
        this.triad1 = new EulerGeometry.Triad(this.triadLength,this.triadAspectRatio,4,0);
        this.scene.add(this.triad1);

        this.triad2 = new EulerGeometry.Triad(this.triadLength,this.triadAspectRatio,3,1);
        this.triad2.position.set(0.001,0.001,0.001);
        this.scene.add(this.triad2);

        //create the final triad for now - it's going to make computations easier but can likely remove it later
        const rotX = JSHelpers.getRandom(-Math.PI, Math.PI);
        const rotY = JSHelpers.getRandom(-Math.PI/2, Math.PI/2);
        const rotZ = JSHelpers.getRandom(-Math.PI, Math.PI);
        this.triad2_final = new EulerGeometry.Triad(this.triadLength,this.triadAspectRatio,3,0);
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

        const triadMaterialColors = ['reds', 'greens', 'blues'];
        for(let dim=0; dim<3; dim++) {
            const arcMaterial = new THREE.MeshBasicMaterial({color: Triad.intFromColor(Triad[triadMaterialColors[dim]][triad1.colorIntensity])});
            arcMaterial.side = THREE.DoubleSide;
            this.arcs[dim] = EulerScene.createArc(triad1, triad2, rotAxis, rotAngle, rotPlane, dim, 10+dim*2, 11+dim*2, this.stripWidth, arcMaterial, this.numFrames, this.arcHeightSegments);
            this.arcs[dim].updateWorldMatrix(true);
            this.scene.add(this.arcs[dim]);
        }
    }

    createArcArrows() {
        const arcArrowMaterial = new THREE.MeshBasicMaterial({color: 0xffffff});
        arcArrowMaterial.side = THREE.DoubleSide;

        for (let dim=0; dim<3; dim++) {
            // we will need a different arrow geometry for each arc because the radii etc. vary and will change the arrow dimensions
            const arcArrowGeometry = EulerScene.arrowGeometryFromArcGeometry(this.arcs[dim].geometry, this.numFrames, this.arcHeightSegments, this.arrowSegmentLength);
            this.arcArrows[dim] = new THREE.Mesh(arcArrowGeometry, arcArrowMaterial);
            this.arcArrows[dim].renderOrder = 999;
            this.arcArrows[dim].onBeforeRender = function (renderer) {
                renderer.clearDepth();
            };
            this.arcs[dim].add(this.arcArrows[dim]);
            this.arcArrows[dim].visible = false;
        }
    }

    createCylinderArcArrows() {
        /*
        v3----v4\\
        |      |  \\
        |      |   \\
        |      |  //
        v1----v2//
         */
        const arcArrowMaterial = new THREE.MeshBasicMaterial({color: 0xffffff});
        const arcArrowGeometry = new THREE.CylinderBufferGeometry(0, this.stripWidth/2, this.stripWidth, 10, 1, false);
        //set the origin at the base of the cone
        arcArrowGeometry.translate(0, this.stripWidth/2, 0);
        for (let dim=0; dim<3; dim++) {
            this.arcArrows[dim] = new THREE.Mesh(arcArrowGeometry, arcArrowMaterial);
            const arcGeometry = this.arcs[dim].geometry;
            const v1Idx = 0;
            const v2Idx =  1;
            const v3Idx = (this.numFrames + 1) * this.arcHeightSegments;
            const v4Idx = v3Idx + 1;
            const arcPositions = arcGeometry.attributes.position.array;
            const v1 = new THREE.Vector3().set(arcPositions[v1Idx * 3], arcPositions[v1Idx * 3 + 1], arcPositions[v1Idx * 3 + 2]);
            const v2 = new THREE.Vector3().set(arcPositions[v2Idx * 3], arcPositions[v2Idx * 3 + 1], arcPositions[v2Idx * 3 + 2]);
            const v3 = new THREE.Vector3().set(arcPositions[v3Idx * 3], arcPositions[v3Idx * 3 + 1], arcPositions[v3Idx * 3 + 2]);
            const v4 = new THREE.Vector3().set(arcPositions[v4Idx * 3], arcPositions[v4Idx * 3 + 1], arcPositions[v4Idx * 3 + 2]);
            const v1v3_mid = new THREE.Vector3().addVectors(v1, v3).multiplyScalar(0.5);
            const v2v4_mid = new THREE.Vector3().addVectors(v2, v4).multiplyScalar(0.5);

            const origin = new THREE.Vector3().copy(v1v3_mid);
            const x_axis = new THREE.Vector3().subVectors(v3, v1);
            const z_axis = new THREE.Vector3().crossVectors(x_axis, new THREE.Vector3().subVectors(v2v4_mid, v1v3_mid));
            const y_axis = new THREE.Vector3().crossVectors(z_axis, x_axis);
            x_axis.normalize();
            y_axis.normalize();
            z_axis.normalize();
            this.arcs[dim].localToWorld(origin);
            this.arcs[dim].localToWorld(x_axis);
            this.arcs[dim].localToWorld(y_axis);
            this.arcs[dim].localToWorld(z_axis);
            this.triad2.arrows[dim].worldToLocal(origin);
            this.triad2.arrows[dim].worldToLocal(x_axis);
            this.triad2.arrows[dim].worldToLocal(y_axis);
            this.triad2.arrows[dim].worldToLocal(z_axis);

            this.arcArrows[dim].position.copy(origin);
            this.arcArrows[dim].setRotationFromMatrix(new THREE.Matrix4().makeBasis(x_axis, y_axis, z_axis));
            this.arcArrows[dim].translateOnAxis(new THREE.Vector3(0, 1, 0), -this.stripWidth-this.triadLength*this.triadAspectRatio/2)
            this.triad2.arrows[dim].add(this.arcArrows[dim]);
            //this.arcArrows[dim].visible = false;
        }
    }
}