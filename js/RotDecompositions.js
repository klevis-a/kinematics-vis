'use strict';

import {Matrix4, Quaternion, Vector3, Matrix3} from "./vendor/three.js/build/three.module.js";
import SVD from './vendor/svd.js'
import {Trajectory} from "./Csv_Processor.js";


export function axisAngleFromQuat(quat) {
    quat.normalize();
    let angle = 2 * Math.acos(quat.w);
    angle = angle > Math.PI ? -(2 * Math.PI - angle) : angle;
    const s = Math.sqrt(1 - quat.w * quat.w);
    const axis = new Vector3(quat.x, quat.y, quat.z);
    if (s >= 0.001) {
        axis.multiplyScalar(1 / s);
    }

    return {axis: axis, angle: angle};
}

export function quatProject(quat, axis) {
    const r = new Vector3(quat.x, quat.y, quat.z);
    const p = new Vector3().copy(axis).multiplyScalar(r.dot(axis));
    return new Quaternion(p.x, p.y, p.z, quat.w).normalize();
}

export class AxisAngle {
    constructor(axis, angle) {
        this.axis = axis;
        this.angle = angle;
    }
}

class EulerDecomposition {
    constructor(mat4) {
        this.mat4 = mat4;
    }

    getElement(row,column) {
        return this.mat4.elements[4*column+row];
    }

    extractAngles() {
        this.angles = [0, 0, 0];
    }

    createAxes() {
        this.axis_1 = new Vector3(1, 0, 0);
        this.axis_2 = new Vector3(0, 1, 0);
        this.axis_3 = new Vector3(0, 0, 1);
        this.axis_2$ = new Vector3(0, 1, 0);
        this.axis_3$ = new Vector3(0, 0, 1);
        this.axis_3$$ = new Vector3(0, 0, 1);
        this.axis_12_combined = new Vector3(1, 1, 1).normalize();
        this.angle_12_combined = 0;
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
        // There is actually 5 different ways to look at Euler angles. The first view R3$$_R2$_R1 corresponds to
        // an intrinsic decomposition. The last view R1_R2_R3 corresponds to an extrinsic decomposition.
        this.R3$$_R2$_R1 = [this.axis_1, this.axis_2$, this.axis_3$$].map(entry => new AxisAngle(entry, this.axisAngleMap.get(entry)));
        this.R3$$_R1_R2 = [this.axis_2, this.axis_1, this.axis_3$$].map(entry => new AxisAngle(entry, this.axisAngleMap.get(entry)));
        this.R2$_R3$_R1 = [this.axis_1, this.axis_3$, this.axis_2$].map(entry => new AxisAngle(entry, this.axisAngleMap.get(entry)));
        this.R2$_R1_R3 = [this.axis_3, this.axis_1, this.axis_2$].map(entry => new AxisAngle(entry, this.axisAngleMap.get(entry)));
        this.R1_R2_R3 = [this.axis_3, this.axis_2, this.axis_1].map(entry => new AxisAngle(entry, this.axisAngleMap.get(entry)));
        this.R3$$_Rcombo  = [new AxisAngle(this.axis_12_combined, this.angle_12_combined), new AxisAngle(this.axis_3$$, this.angles[2]), new AxisAngle(new Vector3(0, 0, 1), 0)];
    }
}

export class EulerDecomposition_RY$$_RZ$_RX extends EulerDecomposition{
    constructor(mat4) {
        super(mat4);
        this.angles = [];
        this.extractAngles();
        this.createAxes();
        super.createAxisAngleMap();
        super.createRotations();
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
}

export class EulerDecomposition_RY$$_RX$_RY extends EulerDecomposition{
    constructor(mat4) {
        super(mat4);
        this.angles = [];
        this.extractAngles();
        this.createAxes();
        super.createAxisAngleMap();
        super.createRotations();
    }

    extractAngles() {
        if (this.getElement(1, 1) < 1) {
            if (this.getElement(1, 1) > -1) {
                // acoording to Wu et al. (Journal of Biomechanics) negative denotes elevation hence the sign below
                this.angles[1] = -Math.acos(this.getElement(1, 1));
                this.angles[0] = Math.atan2(-this.getElement(0, 1), -this.getElement(2, 1));
                this.angles[2] = Math.atan2(-this.getElement(1, 0), this.getElement(1, 2));
            }
            // r11=-1
            else {
                this.angles[0] = -Math.atan2(this.getElement(0,2),this.getElement(0,0));
                this.angles[1] = -Math.PI;
                this.angles[2] = 0;
            }
        }
        // r11=+1
        else {
            this.angles[0] = Math.atan2(this.getElement(0,2),this.getElement(0,0));
            this.angles[1] = 0;
            this.angles[2] = 0;
        }
    }

    createAxes() {
        this.axis_1 = new Vector3(0, 1, 0);
        this.axis_2 = new Vector3(1, 0, 0);
        this.axis_3 = new Vector3(0, 1, 0);

        const afterRot1 = new Matrix4().makeRotationAxis(this.axis_1, this.angles[0]);
        this.axis_2$ = new Vector3().setFromMatrixColumn(afterRot1,0);
        this.axis_3$ = new Vector3().setFromMatrixColumn(afterRot1,1);

        const afterRot2 = new Matrix4().makeRotationAxis(this.axis_2$, this.angles[1]).multiply(afterRot1);
        this.axis_3$$ = new Vector3().setFromMatrixColumn(afterRot2,1);
        const {axis, angle} = axisAngleFromQuat(new Quaternion().setFromRotationMatrix(afterRot2));
        this.axis_12_combined = axis;
        this.angle_12_combined = angle;
    }
}

export class EulerDecomposition_RZ$$_RX$_RY extends EulerDecomposition{
    constructor(mat4) {
        super(mat4);
        this.angles = [];
        this.extractAngles();
        this.createAxes();
        super.createAxisAngleMap();
        super.createRotations();
    }

    extractAngles() {
        if (this.getElement(1, 2) < 1) {
            if (this.getElement(1, 2) > -1) {
                this.angles[1] = Math.asin(-this.getElement(1, 2));
                this.angles[0] = Math.atan2(this.getElement(0, 2), this.getElement(2, 2));
                this.angles[2] = Math.atan2(this.getElement(1, 0), this.getElement(1, 1));
            }
            // r12=-1
            else {
                this.angles[0] = -Math.atan2(-this.getElement(0,1),this.getElement(0,0));
                this.angles[1] = Math.PI/2;
                this.angles[2] = 0;
            }
        }
        // r12=+1
        else {
            this.angles[0] = Math.atan2(-this.getElement(0,1),this.getElement(0,0));
            this.angles[1] = -Math.PI/2;
            this.angles[2] = 0;
        }
    }

    createAxes() {
        this.axis_1 = new Vector3(0, 1, 0);
        this.axis_2 = new Vector3(1, 0, 0);
        this.axis_3 = new Vector3(0, 0, 1);

        const afterRot1 = new Matrix4().makeRotationAxis(this.axis_1, this.angles[0]);
        this.axis_2$ = new Vector3().setFromMatrixColumn(afterRot1,0);
        this.axis_3$ = new Vector3().setFromMatrixColumn(afterRot1,2);

        const afterRot2 = new Matrix4().makeRotationAxis(this.axis_2$, this.angles[1]).multiply(afterRot1);
        this.axis_3$$ = new Vector3().setFromMatrixColumn(afterRot2,2);
        const {axis, angle} = axisAngleFromQuat(new Quaternion().setFromRotationMatrix(afterRot2));
        this.axis_12_combined = axis;
        this.angle_12_combined = angle;
    }
}

export class ShortestPath {
    constructor(quat) {
        this.quat = quat;
        const {axis: axis, angle: angle} = axisAngleFromQuat(this.quat);
        this.rotationSequence = [
            new AxisAngle(axis, angle)
        ];
    }
}

export class SwingTwist {
    constructor(quat, axialAxis) {
        this.quat = quat;
        this.axialAxis = axialAxis;
        this.angles = [];
        this.extractAxialQuat();
        const {axis: nonAxialAxis, angle: nonAxialAngle} = axisAngleFromQuat(this.nonAxialQuat);
        let {axis: axialAxisComp, angle: axialAngle} = axisAngleFromQuat(this.axialQuat);
        if (axialAxisComp.dot(axialAxis) < 0) {
            axialAngle = - axialAngle;
        }
        this.rotationSequence = [
            new AxisAngle(nonAxialAxis, nonAxialAngle),
            new AxisAngle(new Vector3().copy(axialAxis), axialAngle)
        ];
    }

    extractAxialQuat() {
        this.axialQuat = quatProject(this.quat, this.axialAxis);
        this.nonAxialQuat = new Quaternion().copy(this.axialQuat).conjugate().multiply(this.quat).normalize();
    }
}

export function svdDecomp(humerusTrajectory) {

    const y_axes = [];

    for (let i=0; i<humerusTrajectory.NumFrames; i++) {
        const humQuat = humerusTrajectory.humOrientQuat(i);
        const humMat = new Matrix4().makeRotationFromQuaternion(humQuat);
        const y_axis = new Vector3().setFromMatrixColumn(humMat, 1);
        y_axes.push([y_axis.x, y_axis.z]);
    }

    //subtract the mean
    const computeMean = (accumulator, currentValue) => {
        accumulator[0] = accumulator[0] + currentValue[0];
        accumulator[1] = accumulator[1] +currentValue[1];
        return accumulator
    };
    const mean = y_axes.reduce(computeMean, [0, 0]);
    y_axes.forEach(y_axis => {
        y_axis[0]=y_axis[0]-mean[0];
        y_axis[1]=y_axis[1]-mean[1];
    });


    const {u, v, q} = SVD(y_axes, true, true);
    const minDim = q.indexOf(Math.min(...q));
    const majorRotAxis = new Vector3(v[0][minDim], 0, v[1][minDim]);

    return class SvdDecompClass{
        constructor(quat) {
            this.quat = quat;
            this.mat = new Matrix4().makeRotationFromQuaternion(this.quat);
            this.humeralAxis = new Vector3().setFromMatrixColumn(this.mat, 1);
            this.extractAxialQuat();
            this.extractMajorMinorAxis();

            const {axis: majorAxis, angle: majorAngle} = axisAngleFromQuat(this.majorAxisQuat);
            const {axis: minorAxis, angle: minorAngle} = axisAngleFromQuat(this.minorAxisQuat);
            let {axis: axialAxisComp, angle: axialAngle} = axisAngleFromQuat(this.axialQuat);
            if (axialAxisComp.dot(this.humeralAxis) < 0) {
                axialAngle = - axialAngle;
            }
            this.rotationSequence = [
                new AxisAngle(majorAxis, majorAngle),
                new AxisAngle(minorAxis, minorAngle),
                new AxisAngle(new Vector3().copy(this.humeralAxis), axialAngle)
            ];
        }

        extractAxialQuat() {
            this.axialQuat = quatProject(this.quat, this.humeralAxis);
            this.nonAxialQuat = new Quaternion().copy(this.axialQuat).conjugate().multiply(this.quat).normalize();
        }

        extractMajorMinorAxis() {
            this.majorAxisQuat = quatProject(this.nonAxialQuat, majorRotAxis);

            // the decomp below is R_nonaxial = R_major * R_minor - that is the major axis rotation follows the minor
            // axis rotation
            //this.minorAxisQuat = new Quaternion().copy(this.majorAxisQuat).conjugate().multiply(this.nonAxialQuat).normalize();

            // the decomp below is R_nonaxial = R_minor * R_major - that is the minor axis rotation follows the major
            // axis rotation
            this.minorAxisQuat = new Quaternion().copy(this.nonAxialQuat).multiply(new Quaternion().copy(this.majorAxisQuat).conjugate());
        }
    };
}

function addMatrices (A, B) {
    const C = new Matrix3();

    for(let i=0; i<3; i++) {
        for(let j=0; j<3; j++) {
            C.elements[3*i+j] = A.elements[3*i+j] + B.elements[3*i+j];
        }
    }

    return C;
};

export function angularVelocity(traj_mat3) {
    // time between frames in seconds
    const dt = Trajectory.FRAME_PERIOD;

    //compute the symmetric derivative of matrix3
    const traj_derivative = [];
    for(let i=0; i<traj_mat3.length; i++) {
        if(i===0) {
            traj_derivative.push(addMatrices(traj_mat3[i+1], new Matrix3().copy(traj_mat3[i]).multiplyScalar(-1)).multiplyScalar(1/dt));
        } else if (i===(traj_mat3.length-1)) {
            traj_derivative.push(addMatrices(traj_mat3[i], new Matrix3().copy(traj_mat3[i-1]).multiplyScalar(-1)).multiplyScalar(1/dt));
        } else {
            traj_derivative.push(addMatrices(traj_mat3[i+1], new Matrix3().copy(traj_mat3[i-1]).multiplyScalar(-1)).multiplyScalar(1/(2*dt)));
        }
    }

    // compute the angular velocity vector
    // The angular velocity vector is extracted from the angular velocity tensor as the (one-based indexing)
    // {3,2}, {1,3}, and {2,1} components. See https://threejs.org/docs/#api/en/math/Matrix3.elements for how the indices
    // below map to the aforementioned ones
    const angVel = [];
    for(let i=0; i<traj_mat3.length; i++) {
        const angVelTensor = new Matrix3().multiplyMatrices(traj_derivative[i], new Matrix3().copy(traj_mat3[i]).transpose());
        angVel.push(new Vector3(angVelTensor.elements[5], angVelTensor.elements[6], angVelTensor.elements[1]))
    }

    return angVel;
}


export function realAxialRotation(quatTraj) {
    // time between frames in seconds
    const dt = Trajectory.FRAME_PERIOD;

    // first represent as matrix3
    const traj_mat3 = [];
    for(let i=0; i<quatTraj.length; i++) {
        const mat3 = new Matrix3().setFromMatrix4((new Matrix4()).makeRotationFromQuaternion(quatTraj[i]));
        traj_mat3.push(mat3);
    }

    // compute angular velocity
    const angular_velocity = angularVelocity(traj_mat3);

    // first find handle the rotation from identity to the resting humerus orientation
    const shortestAxisAngle = new ShortestPath(quatTraj[0]).rotationSequence[0];
    const shortestAngle = shortestAxisAngle.angle * shortestAxisAngle.axis.y;

    // now handle the rest of the trajectory

    // first project the angular velocity vector onto the shaft axis for each frame
    const angVel_proj = [];
    for(let i=0; i<quatTraj.length; i++) {
        angVel_proj.push(angular_velocity[i].dot(new Vector3().setFromMatrix3Column(traj_mat3[i], 1)));
    }

    // now compute real axial rotation via the trapezoidal rule
    const axialRot = [];
    for(let i=0; i<quatTraj.length; i++) {
        if (i===0) {
            axialRot.push(shortestAngle);
        }
        else {
            axialRot.push(axialRot[axialRot.length-1] + ((angVel_proj[i] + angVel_proj[i-1])/2)*dt);
        }
    }

    return axialRot;
}
