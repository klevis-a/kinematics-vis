import {Matrix4, Vector3, Quaternion} from "./vendor/three.js/build/three.module.js";
import {axisAngleFromQuat} from "./EulerGeometry.js";

class EulerDecomposition {
    constructor(mat4) {
        this.mat4 = mat4;
    }

    getElement(row,column) {
        return this.mat4.elements[4*column+row];
    }
}

export class EulerDecomposition_RY$$_RZ$_RX extends EulerDecomposition{
    constructor(mat4) {
        super(mat4);
        this.angles = [];
        this.extractAngles();
        this.createAxes();
        this.createAxisAngleMap();
        this.createRotations();
    }

    extractAngles() {
        if (this.getElement(0, 1) < 1) {
            if (this.getElement(0, 1) > -1) {
                this.angles[0] = Math.atan2(this.getElement(2, 1), this.getElement(1, 1));
                this.angles[1] = Math.asin(-this.getElement(0, 1));
                this.angles[2] = Math.atan2(this.getElement(0, 2), this.getElement(0, 0));
            }
            // r01=-1
            else {
                this.angles[0] = Math.atan2(-this.getElement(2,0),this.getElement(2,2));
                this.angles[1] = Math.PI/2;
                this.angles[2] = 0;
            }
        }
        // r01=+1
        else {
            this.angles[0] = Math.atan2(-this.getElement(2,0),this.getElement(2,2));
            this.angles[1] = -Math.PI/2;
            this.angles[2] = 0;
        }
    }

    createAxes() {
        this.axis_1 = new Vector3(1, 0, 0);
        this.axis_2 = new Vector3(0, 0, 1);
        this.axis_3 = new Vector3(0, 1, 0);

        const afterRot1 = new Matrix4().makeRotationAxis(this.axis_1, this.angles[0]);
        this.axis_2$ = new Vector3().setFromMatrixColumn(afterRot1,2);
        this.axis_3$ = new Vector3().setFromMatrixColumn(afterRot1,1);

        const afterRot2 = new Matrix4().makeRotationAxis(this.axis_2$, this.angles[1]).multiply(afterRot1);
        this.axis_3$$ = new Vector3().setFromMatrixColumn(afterRot2,1);
        const {axis, angle} = axisAngleFromQuat(new Quaternion().setFromRotationMatrix(afterRot2));
        this.axis_12_combined = axis;
        this.angle_12_combined = angle;
    }

    createAxisAngleMap() {
        this.axisAngleMap = new Map();
        this.axisAngleMap.set(this.axis_1, this.angles[0]);
        this.axisAngleMap.set(this.axis_2, this.angles[1]);
        this.axisAngleMap.set(this.axis_2$, this.angles[1]);
        this.axisAngleMap.set(this.axis_3, this.angles[2]);
        this.axisAngleMap.set(this.axis_3$, this.angles[2]);
        this.axisAngleMap.set(this.axis_3$$, this.angles[2]);
    }

    createRotations() {
        this.R3$$_R2$_R1 = [this.axis_1, this.axis_2$, this.axis_3$$].map(entry => new AxisAngle(entry, this.axisAngleMap.get(entry)), this);
        this.R3$$_R1_R2 = [this.axis_2, this.axis_1, this.axis_3$$].map(entry => new AxisAngle(entry, this.axisAngleMap.get(entry)), this);
        this.R2$_R3$_R1 = [this.axis_1, this.axis_3$, this.axis_2$].map(entry => new AxisAngle(entry, this.axisAngleMap.get(entry)), this);
        this.R2$_R1_R3 = [this.axis_3, this.axis_1, this.axis_2$].map(entry => new AxisAngle(entry, this.axisAngleMap.get(entry)), this);
        this.R1_R2_R3 = [this.axis_3, this.axis_2, this.axis_1].map(entry => new AxisAngle(entry, this.axisAngleMap.get(entry)), this);
        this.R3$$_Rcombo  = [new AxisAngle(this.axis_12_combined, this.angle_12_combined), new AxisAngle(this.axis_3$$, this.angles[2]), new AxisAngle(new Vector3(0, 0, 1), 0)];
    }
}

export class AxialDecomposition {
    constructor(quat, axialAxis) {
        this.quat = quat;
        this.axialAxis = axialAxis;
        this.angles = [];
        this.extractAxialQuat();
        this.extractZXQuat();
        //this.extractNonAxialAngles();
        const {axis, angle} = axisAngleFromQuat(this.nonAxialQuat);
        //console.log(axis);
        this.rotationSequence = [
            new AxisAngle(axis, angle),
            new AxisAngle(new Vector3().copy(axialAxis), 2 * Math.acos(this.axialQuat.w)),
            new AxisAngle(new Vector3(0, 0, 1), 0)
        ];

        /*
        const {axis: zAxis, angle: zAngle} = axisAngleFromQuat(this.zAxisQuat);
        const {axis: xAxis, angle: xAngle} = axisAngleFromQuat(this.xAxisQuat);
        //console.log(zAxis);
        //console.log(xAxis);

        this.rotationSequence = [
            new AxisAngle(zAxis, zAngle),
            new AxisAngle(xAxis, xAngle),
            new AxisAngle(new Vector3().copy(axialAxis), 2 * Math.acos(this.axialQuat.w))
        ]
         */

        /*
        const {axis: zAxis, angle: zAngle} = axisAngleFromQuat(this.zAxisQuat);
        const {axis: xAxis, angle: xAngle} = axisAngleFromQuat(this.xAxisQuat);
        xAxis.applyQuaternion(new Quaternion().copy(this.zAxisQuat).conjugate());

        this.rotationSequence = [
            new AxisAngle(xAxis, xAngle),
            new AxisAngle(zAxis, zAngle),
            new AxisAngle(new Vector3().copy(axialAxis), 2 * Math.acos(this.axialQuat.w))
        ]
         */


    }

    extractAxialQuat() {
        const r = new Vector3(this.quat.x, this.quat.y, this.quat.z);
        const p = new Vector3().copy(this.axialAxis).multiplyScalar(r.dot(this.axialAxis));
        this.axialQuat = new Quaternion(p.x, p.y, p.z, this.quat.w).normalize();
        this.nonAxialQuat = new Quaternion().copy(this.axialQuat).conjugate().multiply(this.quat).normalize();
    }

    extractZXQuat() {
        const zAxis =  new Vector3(1, 0, 0);
        const r = new Vector3(this.nonAxialQuat.x, this.nonAxialQuat.y, this.nonAxialQuat.z);
        const p = new Vector3().copy(zAxis).multiplyScalar(r.dot(zAxis));
        this.zAxisQuat = new Quaternion(p.x, p.y, p.z, this.nonAxialQuat.w).normalize();
        this.xAxisQuat = new Quaternion().multiplyQuaternions(this.nonAxialQuat, new Quaternion().copy(this.zAxisQuat).conjugate());
    }

    extractNonAxialAngles() {
        const test = new Matrix4().makeRotationFromQuaternion(this.nonAxialQuat);
        const test2 = new Matrix4().makeRotationFromQuaternion(this.quat);
        const eulerDecomp = new EulerDecomposition(new Matrix4().makeRotationFromQuaternion(this.nonAxialQuat));
        if (eulerDecomp.getElement(0, 2) < 1) {
            if (eulerDecomp.getElement(0, 2) > -1) {
                this.angles[0] = Math.atan2(-eulerDecomp.getElement(0, 1), eulerDecomp.getElement(0, 0));
                this.angles[1] = Math.atan2(-eulerDecomp.getElement(1, 2), eulerDecomp.getElement(2, 2));
            }
            // r02=-1
            else {
                this.angles[0] = 0;
                this.angles[1] = Math.atan2(-eulerDecomp.getElement(1,0),eulerDecomp.getElement(1,1));
            }
        }
        // r02=+1
        else {
            this.angles[0] = 0;
            this.angles[1] = Math.atan2(-eulerDecomp.getElement(1,0),eulerDecomp.getElement(1,1));
        }
    }
}

export class AxisAngle {
    constructor(axis, angle) {
        this.axis = axis;
        this.angle = angle;
    }
}