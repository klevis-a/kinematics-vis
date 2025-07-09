import {EulerScene} from "./EulerScene.js";
import {Group, Matrix4, Mesh, Quaternion, Vector3} from "three";
import {LineMaterial} from "three/examples/jsm/lines/LineMaterial.js";
import {LineGeometry} from "three/examples/jsm/lines/LineGeometry.js";
import {Line2} from "three/examples/jsm/lines/Line2.js";
import {axisAngleFromQuat} from "./RotDecompositions.js";

EulerScene.prototype.prepare_scene_for_area_vis = function(quatFnc) {
    const recursiveEnable = child => child.layers.enable(this.areaVisLayer);

    // enable scene objects
    const sceneObjects = [this.bone, this.spotlight, this.xyPlane, this.xzPlane, this.yzPlane, this.xAxis, this.yAxis, this.zAxis];
    sceneObjects.forEach(sceneObject => sceneObject.layers.enable(this.areaVisLayer));
    if (this.sphere) {
        this.sphere.traverse(recursiveEnable);
    }

    this.initHumerus_area = new Mesh(this.boneGeometry, EulerScene.BONE_MATERIAL);
    this.initHumerus_area.quaternion.copy(quatFnc(0));
    this.initHumerus_area.layers.set(this.areaVisLayer);
    this.scene.add(this.initHumerus_area);
}

export function update_area_vis_yxy(quatFnc, eulFnc, frameNum) {
    if (this.areaVis) {
        this.areaVis.children.forEach(child => child.geometry.dispose());
        this.scene.remove(this.areaVis);
    }

    const actualPathPoints = [];

    // actual trajectory
    for(let i=0; i<=frameNum; i++) {
        const currentQuat = quatFnc(i);
        const currentMat = new Matrix4().makeRotationFromQuaternion(currentQuat);
        const longAxis = new Vector3();
        currentMat.extractBasis(new Vector3(), longAxis, new Vector3());
        longAxis.multiplyScalar(-this.humerusLength);
        actualPathPoints.push(longAxis.x, longAxis.y, longAxis.z);
    }

    const toZeroPoints = [];
    const startEul = eulFnc(0);
    // decomposition trajectory - go to zero
    for(let i=frameNum; i>=0; i--) {
        const currentFrac = i/frameNum;
        const currentQuat = new Quaternion().setFromAxisAngle(startEul[0].axis, startEul[0].angle).premultiply(
            new Quaternion().setFromAxisAngle(startEul[1].axis, startEul[1].angle * currentFrac));
        const currentMat = new Matrix4().makeRotationFromQuaternion(currentQuat);
        const longAxis = new Vector3();
        currentMat.extractBasis(new Vector3(), longAxis, new Vector3());
        longAxis.multiplyScalar(-this.humerusLength);
        toZeroPoints.push(longAxis.x, longAxis.y, longAxis.z);
    }

    const fromZeroPoints = [];
    const endEul = eulFnc(frameNum);
    // decomposition trajectory - go to zero
    for(let i=0; i<=frameNum; i++) {
        const currentFrac = i/frameNum;
        const currentQuat = new Quaternion().setFromAxisAngle(endEul[0].axis, endEul[0].angle).premultiply(
            new Quaternion().setFromAxisAngle(endEul[1].axis, endEul[1].angle * currentFrac));
        const currentMat = new Matrix4().makeRotationFromQuaternion(currentQuat);
        const longAxis = new Vector3();
        currentMat.extractBasis(new Vector3(), longAxis, new Vector3());
        longAxis.multiplyScalar(-this.humerusLength);
        fromZeroPoints.push(longAxis.x, longAxis.y, longAxis.z);
    }

    const actualPathGeometry = new LineGeometry().setPositions(actualPathPoints);
    const actualLine = new Line2(actualPathGeometry, this.actualPathMat);
    actualLine.layers.set(this.areaVisLayer);

    const toZeroGeometry = new LineGeometry().setPositions(toZeroPoints);
    const toZeroLine = new Line2(toZeroGeometry, this.decompPathMat);
    toZeroLine.layers.set(this.areaVisLayer);

    const fromZeroGeometry = new LineGeometry().setPositions(fromZeroPoints);
    const fromZeroLine = new Line2(fromZeroGeometry, this.decompPathMat);
    fromZeroLine.layers.set(this.areaVisLayer);

    this.areaVis = new Group();
    this.areaVis.add(actualLine);
    this.areaVis.add(toZeroLine);
    this.areaVis.add(fromZeroLine);
    this.areaVis.layers.set(this.areaVisLayer);
    this.scene.add(this.areaVis);
}

export function update_area_vis_xzy(quatFnc, eulFnc, frameNum) {
    if (this.areaVis) {
        this.areaVis.children.forEach(child => child.geometry.dispose());
        this.scene.remove(this.areaVis);
    }

    const actualPathPoints = [];

    // actual trajectory
    for(let i=0; i<=frameNum; i++) {
        const currentQuat = quatFnc(i);
        const currentMat = new Matrix4().makeRotationFromQuaternion(currentQuat);
        const longAxis = new Vector3();
        currentMat.extractBasis(new Vector3(), longAxis, new Vector3());
        longAxis.multiplyScalar(-this.humerusLength);
        actualPathPoints.push(longAxis.x, longAxis.y, longAxis.z);
    }

    const toZeroLatPoints = [];
    const startEul = eulFnc(0);
    // decomposition trajectory - go to zero
    for(let i=frameNum; i>=0; i--) {
        const currentFrac = i/frameNum;
        const currentQuat = new Quaternion().setFromAxisAngle(startEul[0].axis, startEul[0].angle).premultiply(
            new Quaternion().setFromAxisAngle(startEul[1].axis, startEul[1].angle * currentFrac));
        const currentMat = new Matrix4().makeRotationFromQuaternion(currentQuat);
        const longAxis = new Vector3();
        currentMat.extractBasis(new Vector3(), longAxis, new Vector3());
        longAxis.multiplyScalar(-this.humerusLength);
        toZeroLatPoints.push(longAxis.x, longAxis.y, longAxis.z);
    }

    const fromZeroLatPoints = [];
    const endEul = eulFnc(frameNum);
    // decomposition trajectory - go to zero
    for(let i=0; i<=frameNum; i++) {
        const currentFrac = i/frameNum;
        const currentQuat = new Quaternion().setFromAxisAngle(endEul[0].axis, endEul[0].angle).premultiply(
            new Quaternion().setFromAxisAngle(endEul[1].axis, endEul[1].angle * currentFrac));
        const currentMat = new Matrix4().makeRotationFromQuaternion(currentQuat);
        const longAxis = new Vector3();
        currentMat.extractBasis(new Vector3(), longAxis, new Vector3());
        longAxis.multiplyScalar(-this.humerusLength);
        fromZeroLatPoints.push(longAxis.x, longAxis.y, longAxis.z);
    }

    const elevatePoints = [];
    for(let i=0; i<=frameNum; i++) {
        const currentFrac = i/frameNum;
        const elev_diff = endEul[0].angle - startEul[0].angle;
        const currentQuat = new Quaternion().setFromAxisAngle(startEul[0].axis, elev_diff*currentFrac + startEul[0].angle);
        const currentMat = new Matrix4().makeRotationFromQuaternion(currentQuat);
        const longAxis = new Vector3();
        currentMat.extractBasis(new Vector3(), longAxis, new Vector3());
        longAxis.multiplyScalar(-this.humerusLength);
        elevatePoints.push(longAxis.x, longAxis.y, longAxis.z);

    }

    const actualPathGeometry = new LineGeometry().setPositions(actualPathPoints);
    const actualLine = new Line2(actualPathGeometry, this.actualPathMat);
    actualLine.layers.set(this.areaVisLayer);

    const toZeroGeometry = new LineGeometry().setPositions(toZeroLatPoints);
    const toZeroLine = new Line2(toZeroGeometry, this.decompPathMat);
    toZeroLine.layers.set(this.areaVisLayer);

    const fromZeroGeometry = new LineGeometry().setPositions(fromZeroLatPoints);
    const fromZeroLine = new Line2(fromZeroGeometry, this.decompPathMat);
    fromZeroLine.layers.set(this.areaVisLayer);

    const elevateGeometry = new LineGeometry().setPositions(elevatePoints);
    const elevateLine = new Line2(elevateGeometry, this.decompPathMat);
    elevateLine.layers.set(this.areaVisLayer);

    this.areaVis = new Group();
    this.areaVis.add(actualLine);
    this.areaVis.add(toZeroLine);
    this.areaVis.add(fromZeroLine);
    this.areaVis.add(elevateLine);
    this.areaVis.layers.set(this.areaVisLayer);
    this.scene.add(this.areaVis);
}

export function update_area_vis_shortest_path(quatFnc, eulFnc, frameNum) {
    if (this.areaVis) {
        this.areaVis.children.forEach(child => child.geometry.dispose());
        this.scene.remove(this.areaVis);
    }

    const actualPathPoints = [];

    // actual trajectory
    for(let i=0; i<=frameNum; i++) {
        const currentQuat = quatFnc(i);
        const currentMat = new Matrix4().makeRotationFromQuaternion(currentQuat);
        const longAxis = new Vector3();
        currentMat.extractBasis(new Vector3(), longAxis, new Vector3());
        longAxis.multiplyScalar(-this.humerusLength);
        actualPathPoints.push(longAxis.x, longAxis.y, longAxis.z);
    }

    const toEndPoints = [];
    const endDecomp = eulFnc(frameNum);
    // shortest path trajectory - direct rotation along single axis
    for(let i=0; i<=frameNum; i++) {
        const currentFrac = i/frameNum;
        const currentQuat = new Quaternion().setFromAxisAngle(endDecomp[0].axis, endDecomp[0].angle * currentFrac);
        const currentMat = new Matrix4().makeRotationFromQuaternion(currentQuat);
        const longAxis = new Vector3();
        currentMat.extractBasis(new Vector3(), longAxis, new Vector3());
        longAxis.multiplyScalar(-this.humerusLength);
        toEndPoints.push(longAxis.x, longAxis.y, longAxis.z);
    }

    const fromStartPoints = [];
    const startDecomp = eulFnc(0);
    // shortest path trajectory - direct rotation along single axis
    for(let i=frameNum; i>=0; i--) {
        const currentFrac = i/frameNum;
        const currentQuat = new Quaternion().setFromAxisAngle(startDecomp[0].axis, startDecomp[0].angle * currentFrac);
        const currentMat = new Matrix4().makeRotationFromQuaternion(currentQuat);
        const longAxis = new Vector3();
        currentMat.extractBasis(new Vector3(), longAxis, new Vector3());
        longAxis.multiplyScalar(-this.humerusLength);
        fromStartPoints.push(longAxis.x, longAxis.y, longAxis.z);
    }

    const actualPathGeometry = new LineGeometry().setPositions(actualPathPoints);
    const actualLine = new Line2(actualPathGeometry, this.actualPathMat);
    actualLine.layers.set(this.areaVisLayer);

    const toEndGeometry = new LineGeometry().setPositions(toEndPoints);
    const toEndLine = new Line2(toEndGeometry, this.decompPathMat);
    toEndLine.layers.set(this.areaVisLayer);

    const fromStartGeometry = new LineGeometry().setPositions(fromStartPoints);
    const fromStartLine = new Line2(fromStartGeometry, this.decompPathMat);
    fromStartLine.layers.set(this.areaVisLayer);

    this.areaVis = new Group();
    this.areaVis.add(actualLine);
    this.areaVis.add(toEndLine);
    this.areaVis.add(fromStartLine);

    this.areaVis.layers.set(this.areaVisLayer);
    this.scene.add(this.areaVis);
}

export function update_area_vis_shortest_path_start_end(quatFnc, eulFnc, frameNum) {
    if (this.areaVis) {
        this.areaVis.children.forEach(child => child.geometry.dispose());
        this.scene.remove(this.areaVis);
    }

    const actualPathPoints = [];

    // actual trajectory
    for(let i=0; i<=frameNum; i++) {
        const currentQuat = quatFnc(i);
        const currentMat = new Matrix4().makeRotationFromQuaternion(currentQuat);
        const longAxis = new Vector3();
        currentMat.extractBasis(new Vector3(), longAxis, new Vector3());
        longAxis.multiplyScalar(-this.humerusLength);
        actualPathPoints.push(longAxis.x, longAxis.y, longAxis.z);
    }

    const toEndPoints = [];
    const endQuat = quatFnc(frameNum);
    const startQuat = quatFnc(0);
    const rotQuat = new Quaternion().copy(startQuat).conjugate().multiply(endQuat);
    const {axis: axis, angle: angle} = axisAngleFromQuat(rotQuat);

    // shortest path trajectory - direct rotation along single axis
    for(let i=0; i<=frameNum; i++) {
        const currentFrac = i/frameNum;
        const currentRotQuat = new Quaternion().setFromAxisAngle(axis, angle * currentFrac);
        const currentQuat = new Quaternion().copy(startQuat).multiply(currentRotQuat);
        const currentMat = new Matrix4().makeRotationFromQuaternion(currentQuat);
        const longAxis = new Vector3();
        currentMat.extractBasis(new Vector3(), longAxis, new Vector3());
        longAxis.multiplyScalar(-this.humerusLength);
        toEndPoints.push(longAxis.x, longAxis.y, longAxis.z);
    }

    const actualPathGeometry = new LineGeometry().setPositions(actualPathPoints);
    const actualLine = new Line2(actualPathGeometry, this.actualPathMat);
    actualLine.layers.set(this.areaVisLayer);

    const toEndGeometry = new LineGeometry().setPositions(toEndPoints);
    const toEndLine = new Line2(toEndGeometry, this.decompPathMat);
    toEndLine.layers.set(this.areaVisLayer);

    this.areaVis = new Group();
    this.areaVis.add(actualLine);
    this.areaVis.add(toEndLine);

    this.areaVis.layers.set(this.areaVisLayer);
    this.scene.add(this.areaVis);
}

export function enableSphereArea(boneScene, visLayer, quatFnc, eulFnc, visFnc) {
    boneScene.areaVisLayer = visLayer;
    boneScene.actualPathMat = new LineMaterial({color:0x0000ff, linewidth:3, dashed: false});
    boneScene.decompPathMat = new LineMaterial({color:0x964B00, linewidth:3, dashed: false});
    boneScene.areaVisFnc = visFnc;

    boneScene.addEventListener('init', function (event) {
        const scene = event.target;
        scene.prepare_scene_for_area_vis(quatFnc);
    });

    boneScene.addEventListener('reset', function (event) {
        const scene = event.target;
        const frameNum = event.overallFrameNum;
        scene.areaVisFnc(quatFnc, eulFnc, frameNum);
    });

    boneScene.addEventListener('preRender', function (event) {
        const scene = event.target;
        const contentWidth = event.contentWidth;
        const contentHeight = event.contentHeight;
        scene.actualPathMat.resolution.set(contentWidth, contentHeight);
        scene.decompPathMat.resolution.set(contentWidth, contentHeight);
    });

    boneScene.addEventListener('dispose', function (event) {
        const scene = event.target;
        disposeSphereArea(scene);
    });
}

function disposeSphereArea(boneScene) {
    boneScene.actualPathMat.dispose();
    boneScene.decompPathMat.dispose();
    if (boneScene.areaVis) {
        boneScene.areaVis.children.forEach(child => child.geometry.dispose());
    }
}
